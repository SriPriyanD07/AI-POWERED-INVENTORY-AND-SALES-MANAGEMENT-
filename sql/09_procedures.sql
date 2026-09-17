-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 09_procedures.sql
-- DESCRIPTION: Implementation and test execution of the 4 required procedures:
--              1. PROCESS_SALE
--              2. RECEIVE_SHIPMENT
--              3. TRANSFER_STOCK
--              4. CREATE_PURCHASE_ORDER
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 09_procedures.sql — Compiling and Testing Core Procedures
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. PROCEDURE: PROCESS_SALE
-- Description: Validates shelf stock, creates sales header & line, deducts shelf
--              inventory, inserts SALE ledger entry, and calculates sale total.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE PROCESS_SALE (
    p_receipt_number     IN  VARCHAR2,
    p_customer_id        IN  NUMBER,
    p_cashier_id         IN  NUMBER,
    p_shelf_location_id  IN  NUMBER,
    p_product_id         IN  NUMBER,
    p_quantity           IN  NUMBER,
    p_unit_price         IN  NUMBER,
    p_transaction_id     OUT NUMBER,
    p_total_amount       OUT NUMBER
) IS
    v_loc_type          VARCHAR2(20);
    v_stock_qoh         NUMBER(8);
    v_is_active         VARCHAR2(5);
    v_actual_price      NUMBER(10,2);
    v_txn_id            NUMBER(10);
    v_line_subtotal     NUMBER(10,2);
    
    -- User-defined exceptions
    ex_invalid_location EXCEPTION;
    ex_inactive_product EXCEPTION;
    ex_insufficient_stock EXCEPTION;
BEGIN
    -- 1. Validate Product
    BEGIN
        SELECT is_active, standard_unit_price
        INTO v_is_active, v_actual_price
        FROM Product
        WHERE product_id = p_product_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20001, 'Product ID ' || p_product_id || ' does not exist.');
    END;

    IF v_is_active != 'TRUE' THEN
        RAISE ex_inactive_product;
    END IF;

    -- Use provided unit price or default to standard unit price
    IF p_unit_price IS NOT NULL AND p_unit_price > 0 THEN
        v_actual_price := p_unit_price;
    END IF;

    -- 2. Validate Shelf Location (Sales must strictly dispense from SHELF)
    BEGIN
        SELECT location_type
        INTO v_loc_type
        FROM InventoryLocation
        WHERE location_id = p_shelf_location_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20002, 'Location ID ' || p_shelf_location_id || ' does not exist.');
    END;

    IF v_loc_type != 'SHELF' THEN
        RAISE ex_invalid_location;
    END IF;

    -- 3. Validate Live Stock Sufficiency
    BEGIN
        SELECT quantity_on_hand
        INTO v_stock_qoh
        FROM InventoryStock
        WHERE location_id = p_shelf_location_id
          AND product_id = p_product_id
        FOR UPDATE; -- Row-level lock to guarantee concurrency safety
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20003, 'Product is not stocked at shelf location ' || p_shelf_location_id);
    END;

    IF v_stock_qoh < p_quantity THEN
        RAISE ex_insufficient_stock;
    END IF;

    -- 4. Calculate Subtotal
    v_line_subtotal := p_quantity * v_actual_price;

    -- 5. Insert SalesTransaction Header (Initialized to 0; maintained by trigger TRG_SALE_LINE_TOTAL_SYNC)
    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO v_txn_id FROM dual;
    
    INSERT INTO SalesTransaction (
        transaction_id, receipt_number, customer_id, cashier_id, 
        transaction_date, total_amount, status
    ) VALUES (
        v_txn_id, p_receipt_number, p_customer_id, p_cashier_id,
        SYSTIMESTAMP, 0.00, 'COMPLETED'
    );

    -- 6. Insert SalesTransactionLine
    INSERT INTO SalesTransactionLine (
        transaction_id, product_id, shelf_location_id, quantity_sold, unit_price
    ) VALUES (
        v_txn_id, p_product_id, p_shelf_location_id, p_quantity, v_actual_price
    );

    -- 7. Deduct Shelf Stock
    UPDATE InventoryStock
    SET quantity_on_hand = quantity_on_hand - p_quantity,
        last_updated_at = SYSTIMESTAMP
    WHERE location_id = p_shelf_location_id
      AND product_id = p_product_id;

    -- 8. Record Immutable Stock Ledger Entry
    INSERT INTO InventoryTransaction (
        transaction_id, product_id, location_id, transaction_type, 
        quantity, transaction_date, reference_type, reference_id
    ) VALUES (
        SEQ_INV_TXN_ID.NEXTVAL, p_product_id, p_shelf_location_id, 'SALE',
        -p_quantity, SYSTIMESTAMP, 'SALE', v_txn_id
    );

    -- Set OUT parameters
    p_transaction_id := v_txn_id;
    p_total_amount   := v_line_subtotal;

    DBMS_OUTPUT.PUT_LINE('PROCESS_SALE SUCCESS: TxnID=' || v_txn_id || 
                         ', Receipt=' || p_receipt_number || 
                         ', Units Sold=' || p_quantity || 
                         ', Total=' || v_line_subtotal);
EXCEPTION
    WHEN ex_invalid_location THEN
        RAISE_APPLICATION_ERROR(-20010, 'Sale Rejected: Specified location is not a SHELF.');
    WHEN ex_inactive_product THEN
        RAISE_APPLICATION_ERROR(-20011, 'Sale Rejected: Product is discontinued or inactive.');
    WHEN ex_insufficient_stock THEN
        RAISE_APPLICATION_ERROR(-20012, 'Sale Rejected: Insufficient shelf stock. Available=' || 
                                v_stock_qoh || ', Requested=' || p_quantity);
END PROCESS_SALE;
/

-- -----------------------------------------------------------------------------
-- 2. PROCEDURE: RECEIVE_SHIPMENT
-- Description: Validates inbound shipment, increments warehouse inventory stock,
--              writes RECEIPT ledger rows, and updates shipment/PO statuses.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE RECEIVE_SHIPMENT (
    p_shipment_id           IN NUMBER,
    p_warehouse_location_id IN NUMBER,
    p_received_by           IN NUMBER
) IS
    v_loc_type      VARCHAR2(20);
    v_po_id         NUMBER(10);
    v_ship_status   VARCHAR2(30);
    v_rows_updated  NUMBER := 0;
BEGIN
    -- 1. Validate Target Location is WAREHOUSE
    BEGIN
        SELECT location_type INTO v_loc_type
        FROM InventoryLocation
        WHERE location_id = p_warehouse_location_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20020, 'Warehouse Location ID ' || p_warehouse_location_id || ' does not exist.');
    END;

    IF v_loc_type != 'WAREHOUSE' THEN
        RAISE_APPLICATION_ERROR(-20021, 'Shipment Receiving Error: Inbound goods must enter a WAREHOUSE, not a SHELF.');
    END IF;

    -- 2. Validate Shipment
    BEGIN
        SELECT po_id, status INTO v_po_id, v_ship_status
        FROM Shipment
        WHERE shipment_id = p_shipment_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20022, 'Shipment ID ' || p_shipment_id || ' does not exist.');
    END;

    IF v_ship_status = 'RECEIVED' THEN
        RAISE_APPLICATION_ERROR(-20023, 'Shipment ID ' || p_shipment_id || ' has already been received.');
    END IF;

    -- 3. Process Each Shipment Line
    FOR r IN (
        SELECT product_id, quantity_shipped, quantity_received
        FROM ShipmentLine
        WHERE shipment_id = p_shipment_id
    ) LOOP
        -- Update shipment line received quantity
        UPDATE ShipmentLine
        SET quantity_received = r.quantity_shipped
        WHERE shipment_id = p_shipment_id
          AND product_id = r.product_id;

        -- Upsert stock into warehouse
        MERGE INTO InventoryStock stk
        USING dual ON (stk.location_id = p_warehouse_location_id AND stk.product_id = r.product_id)
        WHEN MATCHED THEN
            UPDATE SET stk.quantity_on_hand = stk.quantity_on_hand + r.quantity_shipped,
                       stk.last_updated_at = SYSTIMESTAMP
        WHEN NOT MATCHED THEN
            INSERT (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
            VALUES (p_warehouse_location_id, r.product_id, r.quantity_shipped, 20, 50, SYSTIMESTAMP);

        -- Record RECEIPT ledger entry
        INSERT INTO InventoryTransaction (
            transaction_id, product_id, location_id, transaction_type,
            quantity, transaction_date, reference_type, reference_id
        ) VALUES (
            SEQ_INV_TXN_ID.NEXTVAL, r.product_id, p_warehouse_location_id, 'RECEIPT',
            r.quantity_shipped, SYSTIMESTAMP, 'SHIPMENT', p_shipment_id
        );

        v_rows_updated := v_rows_updated + 1;
    END LOOP;

    -- 4. Update Shipment Status
    UPDATE Shipment
    SET status = 'RECEIVED',
        received_date = SYSDATE,
        received_by = p_received_by
    WHERE shipment_id = p_shipment_id;

    -- 5. Update Purchase Order Status to COMPLETED
    UPDATE PurchaseOrder
    SET status = 'COMPLETED'
    WHERE po_id = v_po_id;

    DBMS_OUTPUT.PUT_LINE('RECEIVE_SHIPMENT SUCCESS: ShipmentID=' || p_shipment_id || 
                         ', PO=' || v_po_id || 
                         ', Products Received=' || v_rows_updated || 
                         ', Target Warehouse=' || p_warehouse_location_id);
END RECEIVE_SHIPMENT;
/

-- -----------------------------------------------------------------------------
-- 3. PROCEDURE: TRANSFER_STOCK
-- Description: Restocks goods from warehouse to shelf. Validates stock,
--              decrements source, increments destination, logs TRANSFER_OUT and
--              TRANSFER_IN ledger records, and creates a RestockEvent.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE TRANSFER_STOCK (
    p_product_id        IN NUMBER,
    p_from_location_id  IN NUMBER,
    p_to_location_id    IN NUMBER,
    p_quantity          IN NUMBER,
    p_employee_id       IN NUMBER DEFAULT NULL,
    p_triggered_by      IN VARCHAR2 DEFAULT 'MANUAL_REQUEST'
) IS
    v_src_qoh           NUMBER(8);
    v_src_type          VARCHAR2(20);
    v_dst_type          VARCHAR2(20);
    v_restock_id        NUMBER(10);
BEGIN
    -- 1. Validate Identical Locations
    IF p_from_location_id = p_to_location_id THEN
        RAISE_APPLICATION_ERROR(-20030, 'Transfer Error: Source and destination locations cannot be identical.');
    END IF;

    IF p_quantity <= 0 THEN
        RAISE_APPLICATION_ERROR(-20031, 'Transfer Error: Quantity must be strictly greater than 0.');
    END IF;

    -- 2. Validate Source Stock
    BEGIN
        SELECT quantity_on_hand INTO v_src_qoh
        FROM InventoryStock
        WHERE location_id = p_from_location_id
          AND product_id = p_product_id
        FOR UPDATE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20032, 'Source stock record not found for product ' || p_product_id);
    END;

    IF v_src_qoh < p_quantity THEN
        RAISE_APPLICATION_ERROR(-20033, 'Transfer Error: Insufficient stock at source. Available=' || 
                                v_src_qoh || ', Requested=' || p_quantity);
    END IF;

    -- 3. Decrement Source Stock
    UPDATE InventoryStock
    SET quantity_on_hand = quantity_on_hand - p_quantity,
        last_updated_at = SYSTIMESTAMP
    WHERE location_id = p_from_location_id
      AND product_id = p_product_id;

    -- 4. Increment Destination Stock (Upsert)
    MERGE INTO InventoryStock stk
    USING dual ON (stk.location_id = p_to_location_id AND stk.product_id = p_product_id)
    WHEN MATCHED THEN
        UPDATE SET stk.quantity_on_hand = stk.quantity_on_hand + p_quantity,
                   stk.last_updated_at = SYSTIMESTAMP
    WHEN NOT MATCHED THEN
        INSERT (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
        VALUES (p_to_location_id, p_product_id, p_quantity, 10, 20, SYSTIMESTAMP);

    -- 5. Create RestockEvent record
    SELECT SEQ_RESTOCK_ID.NEXTVAL INTO v_restock_id FROM dual;
    
    INSERT INTO RestockEvent (
        restock_id, product_id, from_location_id, to_location_id,
        quantity_moved, event_date, triggered_by, performed_by, status
    ) VALUES (
        v_restock_id, p_product_id, p_from_location_id, p_to_location_id,
        p_quantity, SYSTIMESTAMP, p_triggered_by, p_employee_id, 'COMPLETED'
    );

    -- 6. Record TRANSFER_OUT Ledger Row
    INSERT INTO InventoryTransaction (
        transaction_id, product_id, location_id, transaction_type,
        quantity, transaction_date, reference_type, reference_id
    ) VALUES (
        SEQ_INV_TXN_ID.NEXTVAL, p_product_id, p_from_location_id, 'TRANSFER_OUT',
        -p_quantity, SYSTIMESTAMP, 'RESTOCK', v_restock_id
    );

    -- 7. Record TRANSFER_IN Ledger Row
    INSERT INTO InventoryTransaction (
        transaction_id, product_id, location_id, transaction_type,
        quantity, transaction_date, reference_type, reference_id
    ) VALUES (
        SEQ_INV_TXN_ID.NEXTVAL, p_product_id, p_to_location_id, 'TRANSFER_IN',
        p_quantity, SYSTIMESTAMP, 'RESTOCK', v_restock_id
    );

    DBMS_OUTPUT.PUT_LINE('TRANSFER_STOCK SUCCESS: RestockID=' || v_restock_id || 
                         ', Product=' || p_product_id || 
                         ', Moved=' || p_quantity || 
                         ' from Loc ' || p_from_location_id || ' to Loc ' || p_to_location_id);
END TRANSFER_STOCK;
/

-- -----------------------------------------------------------------------------
-- 4. PROCEDURE: CREATE_PURCHASE_ORDER
-- Description: Validates vendor and buyer, creates PO header & line, computes
--              total amount, and supports manual or automated triggering.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE CREATE_PURCHASE_ORDER (
    p_po_number          IN  VARCHAR2,
    p_supplier_id        IN  NUMBER,
    p_created_by         IN  NUMBER,
    p_product_id         IN  NUMBER,
    p_quantity           IN  NUMBER,
    p_unit_price         IN  NUMBER,
    p_is_auto_generated  IN  VARCHAR2 DEFAULT 'FALSE',
    p_po_id              OUT NUMBER
) IS
    v_po_id         NUMBER(10);
    v_line_total    NUMBER(12,2);
    v_dummy         NUMBER;
BEGIN
    -- 1. Validate Supplier
    BEGIN
        SELECT 1 INTO v_dummy FROM Supplier WHERE supplier_id = p_supplier_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20040, 'Supplier ID ' || p_supplier_id || ' does not exist.');
    END;

    -- 2. Validate Employee
    BEGIN
        SELECT 1 INTO v_dummy FROM Employee WHERE employee_id = p_created_by;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20041, 'Employee ID ' || p_created_by || ' does not exist.');
    END;

    -- 3. Validate Product
    BEGIN
        SELECT 1 INTO v_dummy FROM Product WHERE product_id = p_product_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20042, 'Product ID ' || p_product_id || ' does not exist.');
    END;

    IF p_quantity <= 0 OR p_unit_price <= 0 THEN
        RAISE_APPLICATION_ERROR(-20043, 'Quantity and Unit Price must be strictly positive.');
    END IF;

    v_line_total := p_quantity * p_unit_price;

    -- 4. Insert PurchaseOrder Header (Initialized to 0; maintained by trigger TRG_PO_LINE_TOTAL_SYNC)
    SELECT SEQ_PO_ID.NEXTVAL INTO v_po_id FROM dual;
    
    INSERT INTO PurchaseOrder (
        po_id, po_number, supplier_id, created_by, order_date,
        expected_delivery_date, status, total_amount, is_auto_generated
    ) VALUES (
        v_po_id, p_po_number, p_supplier_id, p_created_by, SYSDATE,
        SYSDATE + 7, 'PENDING', 0.00, p_is_auto_generated
    );

    -- 5. Insert PurchaseOrderLine
    INSERT INTO PurchaseOrderLine (
        po_id, product_id, quantity_ordered, unit_price
    ) VALUES (
        v_po_id, p_product_id, p_quantity, p_unit_price
    );

    p_po_id := v_po_id;

    DBMS_OUTPUT.PUT_LINE('CREATE_PURCHASE_ORDER SUCCESS: PO_ID=' || v_po_id || 
                         ', PO_Number=' || p_po_number || 
                         ', Line Total=' || v_line_total || 
                         ', AutoGenerated=' || p_is_auto_generated);
END CREATE_PURCHASE_ORDER;
/

-- -----------------------------------------------------------------------------
-- DEMONSTRATE & TEST PROCEDURES VIA ANONYMOUS BLOCKS
-- -----------------------------------------------------------------------------
PROMPT === Testing PROCEDURE: PROCESS_SALE ===
DECLARE
    v_test_txn_id NUMBER;
    v_test_total  NUMBER;
BEGIN
    -- Sell 1 unit of Amul Salted Butter (Product 2) from Shelf 3 by Cashier 2
    PROCESS_SALE(
        p_receipt_number    => 'RCP-TEST-PROC-01',
        p_customer_id       => 1,
        p_cashier_id        => 2,
        p_shelf_location_id => 3,
        p_product_id        => 2,
        p_quantity          => 1,
        p_unit_price        => 275.00,
        p_transaction_id    => v_test_txn_id,
        p_total_amount      => v_test_total
    );
    DBMS_OUTPUT.PUT_LINE('Returned from PROCESS_SALE: TxnID=' || v_test_txn_id || ', Total=' || v_test_total);
END;
/

PROMPT === Testing PROCEDURE: TRANSFER_STOCK ===
BEGIN
    -- Restock 5 units of Amul Salted Butter (Product 2) from Cold Warehouse (Loc 2) to Front Shelf (Loc 3)
    TRANSFER_STOCK(
        p_product_id       => 2,
        p_from_location_id => 2,
        p_to_location_id   => 3,
        p_quantity         => 5,
        p_employee_id      => 5,
        p_triggered_by     => 'MANUAL_RESTOCK'
    );
END;
/

PROMPT === Testing PROCEDURE: CREATE_PURCHASE_ORDER ===
DECLARE
    v_new_po_id NUMBER;
BEGIN
    -- Create PO for 50 bags of Organic Rice (Product 13) from Organic Harvest (Supplier 5)
    CREATE_PURCHASE_ORDER(
        p_po_number         => 'PO-2026-TEST-09',
        p_supplier_id       => 5,
        p_created_by        => 4,
        p_product_id        => 13,
        p_quantity          => 50,
        p_unit_price        => 310.00,
        p_is_auto_generated => 'FALSE',
        p_po_id             => v_new_po_id
    );
    DBMS_OUTPUT.PUT_LINE('Returned from CREATE_PURCHASE_ORDER: Generated PO_ID=' || v_new_po_id);
END;
/

COMMIT;
PROMPT 09_procedures.sql completed successfully.
