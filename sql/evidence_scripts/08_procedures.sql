-- 08_procedures.sql: Stored Procedures Execution
SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 160 PAGESIZE 50;
SAVEPOINT sp_proc_demo;

DECLARE
    v_test_txn_id NUMBER;
    v_test_total  NUMBER;
    v_new_po_id   NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('============================================================');
    DBMS_OUTPUT.PUT_LINE('PL/SQL STORED PROCEDURES EXECUTION');
    DBMS_OUTPUT.PUT_LINE('============================================================');

    -- 1. PROCESS_SALE
    PROCESS_SALE(
        p_receipt_number    => 'RCP-EVID-DEMO',
        p_customer_id       => 1,
        p_cashier_id        => 4,
        p_shelf_location_id => 4,
        p_product_id        => 4,
        p_quantity          => 2,
        p_unit_price        => 50.00,
        p_transaction_id    => v_test_txn_id,
        p_total_amount      => v_test_total
    );
    DBMS_OUTPUT.PUT_LINE('1. PROCESS_SALE: Completed (TxnID=' || v_test_txn_id || ', Total=' || v_test_total || ')');

    -- 2. RECEIVE_SHIPMENT
    INSERT INTO PurchaseOrder (po_id, po_number, supplier_id, created_by, order_date, status, total_amount, is_auto_generated)
    VALUES (9999, 'PO-TEMP-RCV', 1, 3, SYSDATE, 'APPROVED', 500.00, 'FALSE');
    INSERT INTO Shipment (shipment_id, tracking_number, po_id, carrier, shipment_date, status)
    VALUES (9999, 'TRK-TEMP-RCV', 9999, 'BlueDart', SYSDATE, 'DELIVERED');
    INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received)
    VALUES (9999, 1, 10, 0);

    RECEIVE_SHIPMENT(
        p_shipment_id           => 9999,
        p_warehouse_location_id => 1,
        p_received_by           => 4
    );
    DBMS_OUTPUT.PUT_LINE('2. RECEIVE_SHIPMENT: Completed (Shipment 9999 Received into WH-MAIN-01)');

    -- 3. TRANSFER_STOCK
    TRANSFER_STOCK(
        p_product_id       => 4,
        p_from_location_id => 1,
        p_to_location_id   => 4,
        p_quantity         => 2,
        p_employee_id      => 4,
        p_triggered_by     => 'MANUAL_RESTOCK'
    );
    DBMS_OUTPUT.PUT_LINE('3. TRANSFER_STOCK: Completed (2 units moved from WH-MAIN-01 to SH-BAKERY-01)');

    -- 4. CREATE_PURCHASE_ORDER
    CREATE_PURCHASE_ORDER(
        p_po_number         => 'PO-EVID-DEMO',
        p_supplier_id       => 2,
        p_created_by        => 3,
        p_product_id        => 4,
        p_quantity          => 20,
        p_unit_price        => 40.00,
        p_is_auto_generated => 'FALSE',
        p_po_id             => v_new_po_id
    );
    DBMS_OUTPUT.PUT_LINE('4. CREATE_PURCHASE_ORDER: Completed (PO_ID=' || v_new_po_id || ', 20 units @ 40.00)');

    DBMS_OUTPUT.PUT_LINE('============================================================');
    DBMS_OUTPUT.PUT_LINE('ALL 4 PROCEDURES EXECUTED SUCCESSFULLY');
    DBMS_OUTPUT.PUT_LINE('============================================================');
    DBMS_OUTPUT.PUT_LINE('[PASS] PROCESS_SALE');
    DBMS_OUTPUT.PUT_LINE('[PASS] RECEIVE_SHIPMENT');
    DBMS_OUTPUT.PUT_LINE('[PASS] TRANSFER_STOCK');
    DBMS_OUTPUT.PUT_LINE('[PASS] CREATE_PURCHASE_ORDER');
END;
/

ROLLBACK TO SAVEPOINT sp_proc_demo;

