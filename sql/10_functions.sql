-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 10_functions.sql
-- DESCRIPTION: Implementation and verification of the 3 required functions:
--              1. CALCULATE_SALE_TOTAL
--              2. CALCULATE_STOCK_VALUE
--              3. CALCULATE_LOYALTY_POINTS
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 10_functions.sql — Compiling and Testing User Functions
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. FUNCTION: CALCULATE_SALE_TOTAL
-- Description: Computes total monetary value of lines for a given SalesTransaction.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION CALCULATE_SALE_TOTAL (
    p_transaction_id IN NUMBER
) RETURN NUMBER IS
    v_total NUMBER(10,2);
BEGIN
    SELECT NVL(SUM(quantity_sold * unit_price), 0)
    INTO v_total
    FROM SalesTransactionLine
    WHERE transaction_id = p_transaction_id;

    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END CALCULATE_SALE_TOTAL;
/

-- -----------------------------------------------------------------------------
-- 2. FUNCTION: CALCULATE_STOCK_VALUE
-- Description: Computes live inventory asset valuation (QOH × standard_unit_price).
--              Filters by location if p_location_id is supplied; otherwise aggregates
--              across the entire enterprise.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION CALCULATE_STOCK_VALUE (
    p_product_id  IN NUMBER,
    p_location_id IN NUMBER DEFAULT NULL
) RETURN NUMBER IS
    v_unit_price NUMBER(10,2);
    v_total_qoh  NUMBER(8);
    v_valuation  NUMBER(12,2);
BEGIN
    -- 1. Get standard unit price of product
    SELECT standard_unit_price
    INTO v_unit_price
    FROM Product
    WHERE product_id = p_product_id;

    -- 2. Sum QOH based on location filter
    IF p_location_id IS NOT NULL THEN
        SELECT NVL(SUM(quantity_on_hand), 0)
        INTO v_total_qoh
        FROM InventoryStock
        WHERE product_id = p_product_id
          AND location_id = p_location_id;
    ELSE
        SELECT NVL(SUM(quantity_on_hand), 0)
        INTO v_total_qoh
        FROM InventoryStock
        WHERE product_id = p_product_id;
    END IF;

    v_valuation := ROUND(v_total_qoh * v_unit_price, 2);
    RETURN v_valuation;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN 0;
END CALCULATE_STOCK_VALUE;
/

-- -----------------------------------------------------------------------------
-- 3. FUNCTION: CALCULATE_LOYALTY_POINTS (OPTIONAL / DEMONSTRATION ONLY)
-- Status: OPTIONAL / DEMONSTRATION ONLY — NOT AN APPROVED CORE BUSINESS RULE
-- Note: The SmartRetail DA2 handoff brief does NOT prescribe an approved loyalty
--       calculation rule. As instructed by Section 6 of the handoff brief, this
--       function is provided strictly as an optional academic PL/SQL demonstration
--       of function syntax, return types, and conditional logic. It must NOT be
--       treated as a canonical SmartRetail business rule.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION CALCULATE_LOYALTY_POINTS (
    p_amount IN NUMBER
) RETURN NUMBER IS
BEGIN
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN 0;
    END IF;

    -- Arbitrary academic demo ratio (1 pt per 10 currency units) - Demonstration Only
    RETURN FLOOR(p_amount / 10);
END CALCULATE_LOYALTY_POINTS;
/

-- -----------------------------------------------------------------------------
-- DEMONSTRATE & TEST FUNCTIONS
-- -----------------------------------------------------------------------------
PROMPT === 1. Testing CALCULATE_SALE_TOTAL in SQL Query ===
SELECT 
    transaction_id,
    receipt_number,
    total_amount AS recorded_header_total,
    CALCULATE_SALE_TOTAL(transaction_id) AS computed_line_total
FROM SalesTransaction
ORDER BY transaction_id;

PROMPT === 2. Testing CALCULATE_STOCK_VALUE in SQL Query ===
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    CALCULATE_STOCK_VALUE(p.product_id, NULL) AS total_enterprise_stock_val,
    CALCULATE_STOCK_VALUE(p.product_id, 1)    AS wh_central_stock_val,
    CALCULATE_STOCK_VALUE(p.product_id, 2)    AS wh_cold_stock_val
FROM Product p
WHERE p.product_id IN (1, 2, 4, 7, 13)
ORDER BY p.product_id;

PROMPT === 3. Testing CALCULATE_LOYALTY_POINTS [OPTIONAL / DEMONSTRATION ONLY] ===
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    st.total_amount,
    CALCULATE_LOYALTY_POINTS(st.total_amount) AS points_earned_demo_only
FROM SalesTransaction st
INNER JOIN Customer c ON st.customer_id = c.customer_id
ORDER BY st.total_amount DESC;

PROMPT === 4. Testing Functions in PL/SQL Block with DBMS_OUTPUT ===
DECLARE
    v_sale_tot NUMBER;
    v_stock_val NUMBER;
    v_pts NUMBER;
BEGIN
    v_sale_tot  := CALCULATE_SALE_TOTAL(1);
    v_stock_val := CALCULATE_STOCK_VALUE(1, NULL);
    v_pts       := CALCULATE_LOYALTY_POINTS(1250.75);

    DBMS_OUTPUT.PUT_LINE('PL/SQL Function Results:');
    DBMS_OUTPUT.PUT_LINE('  - CALCULATE_SALE_TOTAL(1)             = ' || v_sale_tot);
    DBMS_OUTPUT.PUT_LINE('  - CALCULATE_STOCK_VALUE(1)            = ' || v_stock_val);
    DBMS_OUTPUT.PUT_LINE('  - CALCULATE_LOYALTY_POINTS(1250.75)   = ' || v_pts || ' points [OPTIONAL DEMO]');
END;
/

PROMPT 10_functions.sql completed successfully.
