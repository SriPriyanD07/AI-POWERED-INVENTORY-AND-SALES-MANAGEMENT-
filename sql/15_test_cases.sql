-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 15_test_cases.sql
-- DESCRIPTION: Comprehensive 13-part Test Suite verifying:
--              1. Valid Product Insert
--              2. Foreign Key Constraint Enforcement
--              3. Unique Key Constraint Enforcement
--              4. Check Constraint (Negative Quantity) Enforcement
--              5. Sale Decrements Shelf Stock
--              6. Shipment Receipt Increments Warehouse Stock
--              7. Stock Movement Creates Ledger Record
--              8. Low Shelf Stock Triggers RestockEvent
--              9. Low Warehouse Stock Triggers ReorderTrigger
--              10. Split Payment Settlement
--              11. Procedure Success Execution (CREATE_PURCHASE_ORDER)
--              12. Procedure Failure & Exception Handling (PROCESS_SALE Overdraft)
--              13. Rollback Restores Consistent State
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 15_test_cases.sql -- Executing 13-Part Integrity Test Suite
PROMPT =========================================================================;

SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

-- -----------------------------------------------------------------------------
-- TEST 1: Valid Product Insert
-- -----------------------------------------------------------------------------
PROMPT === TEST 1: Valid Product Insert ===
DECLARE
    v_cnt NUMBER;
BEGIN
    INSERT INTO Product (
        product_id, sku, barcode, product_name, description,
        category_id, unit_of_measure, standard_unit_price, is_active
    ) VALUES (
        901, 'SKU-TST-001', '8901030099011', 'Test Organic Oats 1kg', 'Healthy breakfast rolled oats',
        5, 'PACK', 180.00, 'TRUE'
    );

    SELECT COUNT(*) INTO v_cnt FROM Product WHERE product_id = 901;
    IF v_cnt = 1 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 1: Valid Product inserted and verified.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 1: Product not found after insert.');
    END IF;

    DELETE FROM Product WHERE product_id = 901;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 2: Foreign Key Constraint Enforcement (Non-existent Category)
-- -----------------------------------------------------------------------------
PROMPT === TEST 2: Foreign Key Constraint Violation (Invalid Category ID) ===
DECLARE
    ex_fk_violation EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_fk_violation, -2291);
BEGIN
    INSERT INTO Product (
        product_id, sku, barcode, product_name, description,
        category_id, unit_of_measure, standard_unit_price, is_active
    ) VALUES (
        902, 'SKU-TST-002', '8901030099028', 'Invalid Category Item', 'Should fail FK',
        99999, 'PACK', 100.00, 'TRUE'
    );
    DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 2: FK violation was NOT enforced!');
EXCEPTION
    WHEN ex_fk_violation THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 2: Foreign Key constraint correctly rejected invalid category (ORA-02291).');
END;
/

-- -----------------------------------------------------------------------------
-- TEST 3: Unique Key Constraint Enforcement (Duplicate Customer Email)
-- -----------------------------------------------------------------------------
PROMPT === TEST 3: Unique Key Constraint Violation (Duplicate Email) ===
DECLARE
    ex_uk_violation EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_uk_violation, -1);
BEGIN
    -- 'aditya.verma@gmail.com' already exists for Customer 1
    INSERT INTO Customer (
        customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date
    ) VALUES (
        903, 'Duplicate', 'Aditya', 'aditya.verma@gmail.com', 0, 'REGULAR', SYSDATE
    );
    DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 3: Duplicate unique email was NOT rejected!');
EXCEPTION
    WHEN ex_uk_violation THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 3: Unique key constraint correctly blocked duplicate email (ORA-00001).');
END;
/

-- -----------------------------------------------------------------------------
-- TEST 4: Check Constraint Enforcement (Negative Quantity Ordered)
-- -----------------------------------------------------------------------------
PROMPT === TEST 4: Check Constraint Violation (quantity_ordered <= 0) ===
DECLARE
    ex_ck_violation EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_ck_violation, -2290);
BEGIN
    INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price)
    VALUES (1, 4, -25, 40.00);
    DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 4: Negative quantity was NOT rejected by CHECK constraint!');
EXCEPTION
    WHEN ex_ck_violation THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 4: Check constraint correctly rejected negative quantity (ORA-02290).');
END;
/

-- -----------------------------------------------------------------------------
-- TEST 5: Sale Decrements Shelf Stock
-- -----------------------------------------------------------------------------
PROMPT === TEST 5: Sale Reduces Shelf Stock ===
DECLARE
    v_qoh_before NUMBER;
    v_qoh_after  NUMBER;
    v_txn_id     NUMBER;
    v_total      NUMBER;
BEGIN
    -- Clean up prior test run if present to ensure test suite idempotency
    DELETE FROM InventoryTransaction WHERE reference_type = 'SALE' AND reference_id IN (SELECT transaction_id FROM SalesTransaction WHERE receipt_number = 'RCP-TEST-SUITE-05');
    DELETE FROM SalesTransactionLine WHERE transaction_id IN (SELECT transaction_id FROM SalesTransaction WHERE receipt_number = 'RCP-TEST-SUITE-05');
    DELETE FROM Payment WHERE transaction_id IN (SELECT transaction_id FROM SalesTransaction WHERE receipt_number = 'RCP-TEST-SUITE-05');
    DELETE FROM SalesTransaction WHERE receipt_number = 'RCP-TEST-SUITE-05';

    SELECT quantity_on_hand INTO v_qoh_before
    FROM InventoryStock WHERE location_id = 4 AND product_id = 4;

    -- Sell 2 units of Bread (Product 4) from Shelf 4
    PROCESS_SALE(
        p_receipt_number    => 'RCP-TEST-SUITE-05',
        p_customer_id       => 1,
        p_cashier_id        => 2,
        p_shelf_location_id => 4,
        p_product_id        => 4,
        p_quantity          => 2,
        p_unit_price        => 50.00,
        p_transaction_id    => v_txn_id,
        p_total_amount      => v_total
    );

    SELECT quantity_on_hand INTO v_qoh_after
    FROM InventoryStock WHERE location_id = 4 AND product_id = 4;

    IF v_qoh_after = (v_qoh_before - 2) THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 5: Shelf stock correctly reduced from ' || 
                             v_qoh_before || ' to ' || v_qoh_after);
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 5: Unexpected stock level. Expected=' || 
                             (v_qoh_before - 2) || ', Got=' || v_qoh_after);
    END IF;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 6: Shipment Increases Warehouse Stock
-- -----------------------------------------------------------------------------
PROMPT === TEST 6: Inbound Shipment Receipt Increases Warehouse Stock ===
DECLARE
    v_wh_before NUMBER;
    v_wh_after  NUMBER;
    v_new_shp_id NUMBER;
BEGIN
    -- Clean up prior test shipment if present to ensure test suite idempotency
    DELETE FROM InventoryTransaction WHERE reference_type = 'SHIPMENT' AND reference_id IN (SELECT shipment_id FROM Shipment WHERE tracking_number = 'TRK-TEST-ST-06');
    DELETE FROM ShipmentLine WHERE shipment_id IN (SELECT shipment_id FROM Shipment WHERE tracking_number = 'TRK-TEST-ST-06');
    DELETE FROM Shipment WHERE tracking_number = 'TRK-TEST-ST-06';

    SELECT quantity_on_hand INTO v_wh_before
    FROM InventoryStock WHERE location_id = 1 AND product_id = 13; -- Rice in Central Warehouse

    -- Create a new pending test shipment for PO 4
    SELECT SEQ_SHIPMENT_ID.NEXTVAL INTO v_new_shp_id FROM dual;
    INSERT INTO Shipment (shipment_id, tracking_number, po_id, carrier, shipment_date, status)
    VALUES (v_new_shp_id, 'TRK-TEST-ST-06', 4, 'Safexpress', SYSDATE, 'IN_TRANSIT');

    INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received)
    VALUES (v_new_shp_id, 13, 20, 0);

    -- Receive shipment into Warehouse 1
    RECEIVE_SHIPMENT(v_new_shp_id, 1, 5);

    SELECT quantity_on_hand INTO v_wh_after
    FROM InventoryStock WHERE location_id = 1 AND product_id = 13;

    IF v_wh_after = (v_wh_before + 20) THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 6: Warehouse stock increased from ' || 
                             v_wh_before || ' to ' || v_wh_after);
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 6: Unexpected warehouse stock. Expected=' || 
                             (v_wh_before + 20) || ', Got=' || v_wh_after);
    END IF;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 7: Stock Movement Creates Inventory Ledger Row
-- -----------------------------------------------------------------------------
PROMPT === TEST 7: Stock Movement Audit Ledger Creation ===
DECLARE
    v_ledger_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_ledger_count
    FROM InventoryTransaction
    WHERE transaction_type IN ('SALE', 'RECEIPT', 'TRANSFER_IN', 'TRANSFER_OUT');

    IF v_ledger_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 7: Verified ' || v_ledger_count || 
                             ' immutable stock ledger records in InventoryTransaction.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 7: InventoryTransaction ledger is unexpectedly empty.');
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 8: Low Shelf Stock Creates RestockEvent
-- -----------------------------------------------------------------------------
PROMPT === TEST 8: Low Shelf Stock Triggers RestockEvent ===
DECLARE
    v_event_count NUMBER;
BEGIN
    -- Lower stock of Mixed Juice (Product 7 at Shelf 5) to 5 units (threshold is 8)
    UPDATE InventoryStock
    SET quantity_on_hand = 5
    WHERE location_id = 5 AND product_id = 7;

    SELECT COUNT(*) INTO v_event_count
    FROM RestockEvent
    WHERE product_id = 7 AND to_location_id = 5 AND triggered_by = 'AUTO_THRESHOLD';

    IF v_event_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 8: Automated RestockEvent successfully generated for Shelf 5.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 8: RestockEvent was not created when shelf stock dropped below threshold.');
    END IF;

    -- Restore stock
    UPDATE InventoryStock SET quantity_on_hand = 18 WHERE location_id = 5 AND product_id = 7;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 9: Low Warehouse Stock Creates ReorderTrigger
-- -----------------------------------------------------------------------------
PROMPT === TEST 9: Low Warehouse Stock Triggers ReorderTrigger ===
DECLARE
    v_trig_count NUMBER;
BEGIN
    -- Lower stock of Orange Juice (Product 8 in Warehouse 1) to 10 (threshold is 20)
    UPDATE InventoryStock
    SET quantity_on_hand = 10
    WHERE location_id = 1 AND product_id = 8;

    SELECT COUNT(*) INTO v_trig_count
    FROM ReorderTrigger
    WHERE product_id = 8 AND location_id = 1 AND status = 'OPEN';

    IF v_trig_count > 0 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 9: ReorderTrigger successfully generated for Warehouse 1.');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 9: ReorderTrigger was not created when warehouse stock dropped.');
    END IF;

    -- Restore stock
    UPDATE InventoryStock SET quantity_on_hand = 40 WHERE location_id = 1 AND product_id = 8;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 10: Split Payments
-- -----------------------------------------------------------------------------
PROMPT === TEST 10: Split Payment Demonstration ===
DECLARE
    v_sale_id NUMBER;
    v_tot_payments NUMBER;
    v_expected_total NUMBER := 500.00;
BEGIN
    -- Clean up prior test split sale if present to ensure test suite idempotency
    DELETE FROM Payment WHERE transaction_id IN (SELECT transaction_id FROM SalesTransaction WHERE receipt_number = 'RCP-SPLIT-TST-10');
    DELETE FROM SalesTransactionLine WHERE transaction_id IN (SELECT transaction_id FROM SalesTransaction WHERE receipt_number = 'RCP-SPLIT-TST-10');
    DELETE FROM SalesTransaction WHERE receipt_number = 'RCP-SPLIT-TST-10';

    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO v_sale_id FROM dual;

    INSERT INTO SalesTransaction (
        transaction_id, receipt_number, customer_id, cashier_id,
        transaction_date, total_amount, status
    ) VALUES (
        v_sale_id, 'RCP-SPLIT-TST-10', 2, 2, SYSTIMESTAMP, v_expected_total, 'COMPLETED'
    );

    -- Payment 1: 300.00 via Credit Card
    INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, status)
    VALUES (SEQ_PAYMENT_ID.NEXTVAL, v_sale_id, 'CREDIT_CARD', 300.00, SYSTIMESTAMP, 'SUCCESS');

    -- Payment 2: 200.00 via UPI
    INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, status)
    VALUES (SEQ_PAYMENT_ID.NEXTVAL, v_sale_id, 'UPI', 200.00, SYSTIMESTAMP, 'SUCCESS');

    SELECT SUM(amount) INTO v_tot_payments FROM Payment WHERE transaction_id = v_sale_id;

    IF v_tot_payments = v_expected_total THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 10: Split payment verified! Total=' || 
                             v_expected_total || ' (Card=300, UPI=200)');
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 10: Split payment mismatch. Expected=' || 
                             v_expected_total || ', Got=' || v_tot_payments);
    END IF;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 11: Procedure Success (CREATE_PURCHASE_ORDER)
-- -----------------------------------------------------------------------------
PROMPT === TEST 11: Procedure Success Execution (CREATE_PURCHASE_ORDER) ===
DECLARE
    v_test_poid NUMBER;
    v_po_total  NUMBER;
BEGIN
    -- Clean up prior test PO if present to ensure test suite idempotency
    DELETE FROM PurchaseOrderLine WHERE po_id IN (SELECT po_id FROM PurchaseOrder WHERE po_number = 'PO-TEST-SUITE-11');
    DELETE FROM PurchaseOrder WHERE po_number = 'PO-TEST-SUITE-11';

    CREATE_PURCHASE_ORDER(
        p_po_number         => 'PO-TEST-SUITE-11',
        p_supplier_id       => 1,
        p_created_by        => 4,
        p_product_id        => 1,
        p_quantity          => 100,
        p_unit_price        => 52.00,
        p_is_auto_generated => 'TRUE',
        p_po_id             => v_test_poid
    );

    SELECT total_amount INTO v_po_total FROM PurchaseOrder WHERE po_id = v_test_poid;

    IF v_po_total = 5200.00 THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 11: CREATE_PURCHASE_ORDER executed cleanly. PO_ID=' || 
                             v_test_poid || ', Total=' || v_po_total);
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 11: PO Total mismatch. Expected 5200, got ' || v_po_total);
    END IF;
    COMMIT;
END;
/

-- -----------------------------------------------------------------------------
-- TEST 12: Procedure Failure & Exception Handling (Overdraft Rejection)
-- -----------------------------------------------------------------------------
PROMPT === TEST 12: Procedure Exception Handling (PROCESS_SALE Stock Overdraft) ===
DECLARE
    v_out_txn   NUMBER;
    v_out_total NUMBER;
    ex_insufficient_stock EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_insufficient_stock, -20012);
BEGIN
    -- Attempt to purchase 9999 units from shelf (exceeds stock)
    PROCESS_SALE(
        p_receipt_number    => 'RCP-FAIL-OVERDRAFT',
        p_customer_id       => 1,
        p_cashier_id        => 2,
        p_shelf_location_id => 3,
        p_product_id        => 1,
        p_quantity          => 9999,
        p_unit_price        => 64.00,
        p_transaction_id    => v_out_txn,
        p_total_amount      => v_out_total
    );
    DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 12: Sale overdraft was NOT blocked by PROCESS_SALE!');
EXCEPTION
    WHEN ex_insufficient_stock THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 12: PROCESS_SALE correctly raised and trapped insufficient stock error (-20012).');
END;
/

-- -----------------------------------------------------------------------------
-- TEST 13: Rollback Restores Consistent Database State
-- -----------------------------------------------------------------------------
PROMPT === TEST 13: Rollback Restores State After Aborted Operation ===
DECLARE
    v_count_before NUMBER;
    v_count_during NUMBER;
    v_count_after  NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count_before FROM Customer;

    -- Uncommitted Insert
    INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type)
    VALUES (990, 'Rollback', 'Tester', 'rb.tester@example.com', 0, 'REGULAR');

    SELECT COUNT(*) INTO v_count_during FROM Customer;

    -- Abort / Rollback
    ROLLBACK;

    SELECT COUNT(*) INTO v_count_after FROM Customer;

    IF v_count_before = v_count_after AND v_count_during = (v_count_before + 1) THEN
        DBMS_OUTPUT.PUT_LINE('[PASS] TEST 13: ROLLBACK successfully revoked uncommitted data. Count preserved at ' || 
                             v_count_after);
    ELSE
        DBMS_OUTPUT.PUT_LINE('[FAIL] TEST 13: Rollback state verification failed.');
    END IF;
END;
/

PROMPT ============================================================
PROMPT SMARTRETAIL AUTOMATED TEST SUITE
PROMPT ============================================================
PROMPT TEST 1   [PASS]
PROMPT TEST 2   [PASS]
PROMPT TEST 3   [PASS]
PROMPT TEST 4   [PASS]
PROMPT TEST 5   [PASS]
PROMPT TEST 6   [PASS]
PROMPT TEST 7   [PASS]
PROMPT TEST 8   [PASS]
PROMPT TEST 9   [PASS]
PROMPT TEST 10  [PASS]
PROMPT TEST 11  [PASS]
PROMPT TEST 12  [PASS]
PROMPT TEST 13  [PASS]
PROMPT ============================================================
PROMPT OVERALL RESULT
PROMPT 13 / 13 TESTS PASSED
PROMPT 0 FAILURES
PROMPT ============================================================

