-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 11_cursors.sql
-- DESCRIPTION: Demonstrations of PL/SQL Cursors:
--              1. Explicit Cursor (OPEN, FETCH, %FOUND/%NOTFOUND, CLOSE)
--              2. Cursor FOR LOOP (Automatic open, fetch, exit, close)
--              3. Parameterized Cursor (Passing dynamic parameters to cursor)
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 11_cursors.sql — Demonstrating Explicit, FOR Loop, & Parameterized Cursors
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. EXPLICIT CURSOR (OPEN, FETCH, %NOTFOUND, CLOSE)
-- Scenario: Inventory Stock Auditor. Iterates through stock levels across all
--           locations and flags low-stock conditions requiring reorder.
-- -----------------------------------------------------------------------------
PROMPT === 1. EXPLICIT CURSOR: Inventory Stock Audit and Low Stock Identifier ===
DECLARE
    -- Explicit Cursor Declaration
    CURSOR cur_stock_audit IS
        SELECT 
            loc.location_code,
            loc.location_type,
            p.sku,
            p.product_name,
            stk.quantity_on_hand,
            stk.reorder_threshold
        FROM InventoryStock stk
        INNER JOIN InventoryLocation loc ON stk.location_id = loc.location_id
        INNER JOIN Product p             ON stk.product_id = p.product_id
        ORDER BY loc.location_type, p.sku;

    -- Record variable using %ROWTYPE
    v_rec cur_stock_audit%ROWTYPE;
    v_total_reviewed NUMBER := 0;
    v_low_count      NUMBER := 0;
BEGIN
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    DBMS_OUTPUT.PUT_LINE('EXPLICIT CURSOR INVENTORY AUDIT REPORT');
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    DBMS_OUTPUT.PUT_LINE(RPAD('LOC CODE', 15) || RPAD('SKU', 14) || RPAD('PRODUCT NAME', 28) || 
                         LPAD('QOH', 6) || LPAD('THRESH', 8) || '  ' || 'STATUS');
    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');

    -- Explicit OPEN
    OPEN cur_stock_audit;

    LOOP
        -- Explicit FETCH
        FETCH cur_stock_audit INTO v_rec;
        EXIT WHEN cur_stock_audit%NOTFOUND;

        v_total_reviewed := v_total_reviewed + 1;

        IF v_rec.quantity_on_hand <= v_rec.reorder_threshold THEN
            v_low_count := v_low_count + 1;
            DBMS_OUTPUT.PUT_LINE(RPAD(v_rec.location_code, 15) || 
                                 RPAD(v_rec.sku, 14) || 
                                 RPAD(SUBSTR(v_rec.product_name, 1, 26), 28) || 
                                 LPAD(v_rec.quantity_on_hand, 6) || 
                                 LPAD(v_rec.reorder_threshold, 8) || '  ' || '[**REORDER ALERT**]');
        ELSE
            DBMS_OUTPUT.PUT_LINE(RPAD(v_rec.location_code, 15) || 
                                 RPAD(v_rec.sku, 14) || 
                                 RPAD(SUBSTR(v_rec.product_name, 1, 26), 28) || 
                                 LPAD(v_rec.quantity_on_hand, 6) || 
                                 LPAD(v_rec.reorder_threshold, 8) || '  ' || 'OK');
        END IF;
    END LOOP;

    -- Explicit CLOSE
    CLOSE cur_stock_audit;

    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('Summary: ' || v_total_reviewed || ' stock records audited. ' || 
                         v_low_count || ' locations require replenishment.');
    DBMS_OUTPUT.PUT_LINE('======================================================================');
END;
/

-- -----------------------------------------------------------------------------
-- 2. CURSOR FOR LOOP
-- Scenario: Daily Sales Reconciliation. Iterates through completed transactions,
--           aggregating total revenue and cashier performance.
-- -----------------------------------------------------------------------------
PROMPT === 2. CURSOR FOR LOOP: Daily Sales Reconciliation & Tender Summary ===
DECLARE
    v_grand_total NUMBER(12,2) := 0;
    v_order_count NUMBER := 0;
BEGIN
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    DBMS_OUTPUT.PUT_LINE('CURSOR FOR LOOP: SALES RECONCILIATION');
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    DBMS_OUTPUT.PUT_LINE(RPAD('RECEIPT NO', 16) || RPAD('CUSTOMER', 20) || RPAD('CASHIER', 18) || 
                         LPAD('TOTAL (INR)', 14));
    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');

    -- Cursor FOR loop automatically handles OPEN, FETCH, and CLOSE
    FOR sale_rec IN (
        SELECT 
            st.receipt_number,
            NVL(c.first_name || ' ' || c.last_name, 'Guest Customer') AS customer_name,
            e.full_name AS cashier_name,
            st.total_amount
        FROM SalesTransaction st
        LEFT JOIN Customer c ON st.customer_id = c.customer_id
        INNER JOIN Employee e ON st.cashier_id = e.employee_id
        WHERE st.status = 'COMPLETED'
        ORDER BY st.transaction_id
    ) LOOP
        v_order_count := v_order_count + 1;
        v_grand_total := v_grand_total + sale_rec.total_amount;

        DBMS_OUTPUT.PUT_LINE(RPAD(sale_rec.receipt_number, 16) || 
                             RPAD(SUBSTR(sale_rec.customer_name, 1, 18), 20) || 
                             RPAD(SUBSTR(sale_rec.cashier_name, 1, 16), 18) || 
                             LPAD(TO_CHAR(sale_rec.total_amount, '999,990.00'), 14));
    END LOOP;

    DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('Total Completed Sales: ' || v_order_count || 
                         ' | Grand Total Settled: INR ' || TO_CHAR(v_grand_total, '999,990.00'));
    DBMS_OUTPUT.PUT_LINE('======================================================================');
END;
/

-- -----------------------------------------------------------------------------
-- 3. PARAMETERIZED CURSOR
-- Scenario: Category Inspector. Takes a category_id parameter, fetches all
--           products within that category, and displays price & active status.
-- -----------------------------------------------------------------------------
PROMPT === 3. PARAMETERIZED CURSOR: Category Product Inspector ===
DECLARE
    -- Parameterized Cursor Declaration
    CURSOR cur_category_products (p_cat_id NUMBER) IS
        SELECT 
            p.product_id,
            p.sku,
            p.product_name,
            p.unit_of_measure,
            p.standard_unit_price,
            p.is_active
        FROM Product p
        WHERE p.category_id = p_cat_id
        ORDER BY p.standard_unit_price DESC;

    v_cat_name VARCHAR2(100);

    PROCEDURE inspect_category(p_cid NUMBER) IS
        v_prod_count NUMBER := 0;
    BEGIN
        SELECT category_name INTO v_cat_name 
        FROM ProductCategory 
        WHERE category_id = p_cid;

        DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE('CATEGORY REPORT FOR: [' || p_cid || '] ' || UPPER(v_cat_name));
        DBMS_OUTPUT.PUT_LINE('----------------------------------------------------------------------');
        DBMS_OUTPUT.PUT_LINE(RPAD('SKU', 14) || RPAD('PRODUCT NAME', 32) || RPAD('UOM', 10) || 
                             LPAD('PRICE', 10) || '  ' || 'ACTIVE');

        -- Open parameterized cursor with specific argument
        FOR p_rec IN cur_category_products(p_cid) LOOP
            v_prod_count := v_prod_count + 1;
            DBMS_OUTPUT.PUT_LINE(RPAD(p_rec.sku, 14) || 
                                 RPAD(SUBSTR(p_rec.product_name, 1, 30), 32) || 
                                 RPAD(p_rec.unit_of_measure, 10) || 
                                 LPAD(TO_CHAR(p_rec.standard_unit_price, '990.00'), 10) || '  ' || 
                                 p_rec.is_active);
        END LOOP;

        IF v_prod_count = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  (No products assigned to this category)');
        END IF;
    END;
BEGIN
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    DBMS_OUTPUT.PUT_LINE('PARAMETERIZED CURSOR DEMONSTRATION');
    DBMS_OUTPUT.PUT_LINE('======================================================================');
    -- Inspect Category 7 (Butter & Cheese)
    inspect_category(7);
    -- Inspect Category 9 (Cookies & Biscuits)
    inspect_category(9);
    -- Inspect Category 10 (Packaged Juices)
    inspect_category(10);
    DBMS_OUTPUT.PUT_LINE('======================================================================');
END;
/

PROMPT 11_cursors.sql completed successfully.
