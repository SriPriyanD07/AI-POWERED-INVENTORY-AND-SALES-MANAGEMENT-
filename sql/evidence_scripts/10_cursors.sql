-- 10_cursors.sql: Explicit, Loop, and Parameterized Cursors
SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 160 PAGESIZE 50;

PROMPT ============================================================;
PROMPT 1. EXPLICIT CURSOR (OPEN, FETCH, %NOTFOUND, CLOSE)
PROMPT ============================================================;
DECLARE
    CURSOR c_low_stock IS
        SELECT p.product_name, loc.location_code, s.quantity_on_hand, s.reorder_threshold
        FROM InventoryStock s
        JOIN Product p ON s.product_id = p.product_id
        JOIN InventoryLocation loc ON s.location_id = loc.location_id
        WHERE s.quantity_on_hand <= s.reorder_threshold AND ROWNUM <= 3
        ORDER BY s.quantity_on_hand ASC;
    v_pname     Product.product_name%TYPE;
    v_loc_code  InventoryLocation.location_code%TYPE;
    v_qoh       InventoryStock.quantity_on_hand%TYPE;
    v_thresh    InventoryStock.reorder_threshold%TYPE;
BEGIN
    OPEN c_low_stock;
    DBMS_OUTPUT.PUT_LINE(RPAD('PRODUCT NAME', 28) || RPAD('LOCATION', 14) || LPAD('QOH', 6) || LPAD('THRESH', 8));
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 56, '-'));
    LOOP
        FETCH c_low_stock INTO v_pname, v_loc_code, v_qoh, v_thresh;
        EXIT WHEN c_low_stock%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE(RPAD(SUBSTR(v_pname, 1, 26), 28) || RPAD(v_loc_code, 14) ||
                             LPAD(v_qoh, 6) || LPAD(v_thresh, 8));
    END LOOP;
    CLOSE c_low_stock;
END;
/

PROMPT ============================================================;
PROMPT 2. CURSOR FOR LOOP (AUTOMATIC OPEN, FETCH, CLOSE)
PROMPT ============================================================;
BEGIN
    DBMS_OUTPUT.PUT_LINE(RPAD('RECEIPT NO', 18) || RPAD('CASHIER', 20) || LPAD('TOTAL (INR)', 12));
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 50, '-'));
    FOR sale_rec IN (
        SELECT st.receipt_number, e.full_name AS cashier_name, st.total_amount
        FROM SalesTransaction st
        JOIN Employee e ON st.cashier_id = e.employee_id
        WHERE ROWNUM <= 3
        ORDER BY st.transaction_id
    ) LOOP
        DBMS_OUTPUT.PUT_LINE(RPAD(sale_rec.receipt_number, 18) ||
                             RPAD(SUBSTR(sale_rec.cashier_name, 1, 18), 20) ||
                             LPAD(TO_CHAR(sale_rec.total_amount, '9990.00'), 12));
    END LOOP;
END;
/

PROMPT ============================================================;
PROMPT 3. PARAMETERIZED CURSOR (DYNAMIC CATEGORY FILTER)
PROMPT ============================================================;
DECLARE
    CURSOR c_cat_products (cp_cat_id NUMBER) IS
        SELECT sku, product_name, standard_unit_price
        FROM Product
        WHERE category_id = cp_cat_id AND ROWNUM <= 3
        ORDER BY standard_unit_price DESC;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Products in Category 5 (Pantry Staples):');
    DBMS_OUTPUT.PUT_LINE(RPAD('SKU', 14) || RPAD('PRODUCT NAME', 28) || LPAD('PRICE', 10));
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 52, '-'));
    FOR r IN c_cat_products(5) LOOP
        DBMS_OUTPUT.PUT_LINE(RPAD(r.sku, 14) || RPAD(SUBSTR(r.product_name, 1, 26), 28) || LPAD(TO_CHAR(r.standard_unit_price, '990.00'), 10));
    END LOOP;
END;
/

