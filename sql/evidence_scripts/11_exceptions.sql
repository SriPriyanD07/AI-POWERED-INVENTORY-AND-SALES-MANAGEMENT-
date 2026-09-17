-- 11_exceptions.sql: Predefined and User-Defined Exception Handling
SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 160 PAGESIZE 50;

PROMPT ============================================================;
PROMPT 1. PREDEFINED EXCEPTION: NO_DATA_FOUND
PROMPT ============================================================;
DECLARE
    v_name Customer.first_name%TYPE;
BEGIN
    SELECT first_name INTO v_name FROM Customer WHERE customer_id = 99999;
    DBMS_OUTPUT.PUT_LINE('Customer found: ' || v_name);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('[CAUGHT NO_DATA_FOUND] Trapped query for non-existent Customer ID 99999.');
END;
/

PROMPT ============================================================;
PROMPT 2. PREDEFINED EXCEPTION: DUP_VAL_ON_INDEX
PROMPT ============================================================;
DECLARE
    v_existing_sku VARCHAR2(50) := 'SKU-DRY-001';
BEGIN
    INSERT INTO Product (product_id, sku, barcode, product_name, category_id, unit_of_measure, standard_unit_price, is_active)
    VALUES (9999, v_existing_sku, '999999999999', 'Duplicate Test', 6, 'LITER', 50.00, 'TRUE');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('[CAUGHT DUP_VAL_ON_INDEX] Trapped duplicate insert for existing SKU: ' || v_existing_sku);
END;
/

PROMPT ============================================================;
PROMPT 3. PREDEFINED EXCEPTION: TOO_MANY_ROWS
PROMPT ============================================================;
DECLARE
    v_emp_name VARCHAR2(150);
BEGIN
    SELECT full_name INTO v_emp_name FROM Employee WHERE role = 'CASHIER';
    DBMS_OUTPUT.PUT_LINE('Cashier: ' || v_emp_name);
EXCEPTION
    WHEN TOO_MANY_ROWS THEN
        DBMS_OUTPUT.PUT_LINE('[CAUGHT TOO_MANY_ROWS] Trapped single-row SELECT returning multiple cashiers.');
END;
/

PROMPT ============================================================;
PROMPT 4. USER-DEFINED EXCEPTION: Insufficient Shelf Stock (-20012)
PROMPT ============================================================;
DECLARE
    ex_insufficient_stock EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_insufficient_stock, -20012);
    v_txn_id NUMBER;
    v_tot NUMBER;
BEGIN
    PROCESS_SALE(
        p_receipt_number    => 'RCP-FAIL-OVERDRAFT',
        p_customer_id       => 1,
        p_cashier_id        => 4,
        p_shelf_location_id => 4,
        p_product_id        => 4,
        p_quantity          => 9999,
        p_unit_price        => 50.00,
        p_transaction_id    => v_txn_id,
        p_total_amount      => v_tot
    );
EXCEPTION
    WHEN ex_insufficient_stock THEN
        DBMS_OUTPUT.PUT_LINE('[CAUGHT USER-DEFINED EXCEPTION -20012] Trapped inventory overdraft cleanly.');
END;
/

PROMPT ============================================================;
PROMPT 5. GENERAL EXCEPTION HANDLER: OTHERS with SQLCODE & SQLERRM
PROMPT ============================================================;
DECLARE
    v_num NUMBER := 100;
    v_zero NUMBER := 0;
    v_res NUMBER;
BEGIN
    v_res := v_num / v_zero;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('[CAUGHT IN OTHERS HANDLER] SQLCODE=' || SQLCODE || ' - ' || SQLERRM);
END;
/
