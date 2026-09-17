-- 09_functions.sql: Stored Functions Demonstration
SET LINESIZE 140 PAGESIZE 50 FEEDBACK ON;
COLUMN sale_id FORMAT 999999 HEADING "TXN_ID";
COLUMN computed_total FORMAT 999990.99 HEADING "CALCULATED_TOTAL";
COLUMN product_id FORMAT 999999 HEADING "PROD_ID";
COLUMN product_name FORMAT A32 HEADING "PRODUCT_NAME";
COLUMN stock_value FORMAT 999990.99 HEADING "CALCULATED_STOCK_VAL";

PROMPT ============================================================;
PROMPT FUNCTION 1: CALCULATE_SALE_TOTAL (Approved Business Rule)
PROMPT ============================================================;
SELECT transaction_id AS sale_id,
       CALCULATE_SALE_TOTAL(transaction_id) AS computed_total
FROM SalesTransaction
WHERE ROWNUM <= 4;

PROMPT ============================================================;
PROMPT FUNCTION 2: CALCULATE_STOCK_VALUE (Approved Business Rule)
PROMPT ============================================================;
SELECT p.product_id, SUBSTR(p.product_name, 1, 32) AS product_name,
       CALCULATE_STOCK_VALUE(p.product_id) AS stock_value
FROM Product p
WHERE p.product_id IN (1, 2, 3, 4);

PROMPT ============================================================;
PROMPT NOTE: CALCULATE_LOYALTY_POINTS is OPTIONAL / DEMONSTRATION ONLY
PROMPT (No loyalty formula is an approved business rule in DA2 brief)
PROMPT ============================================================;

