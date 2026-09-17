-- 07_views.sql: Approved SmartRetail Views Demonstration
SET LINESIZE 160 PAGESIZE 50 FEEDBACK ON;
PROMPT =========================================================================;
PROMPT VIEW 1: VW_LOW_STOCK (Live Critical Shelf Stock Below Reorder Threshold)
PROMPT =========================================================================;
COLUMN location_code FORMAT A14 HEADING "LOC_CODE";
COLUMN location_type FORMAT A10 HEADING "TYPE";
COLUMN sku FORMAT A12 HEADING "SKU";
COLUMN product_name FORMAT A28 HEADING "PRODUCT_NAME";
COLUMN quantity_on_hand FORMAT 9999 HEADING "QOH";
COLUMN reorder_threshold FORMAT 9999 HEADING "THRESH";
COLUMN deficit_quantity FORMAT 9999 HEADING "DEFICIT";

SELECT location_code, location_type, sku, SUBSTR(product_name, 1, 28) AS product_name,
       quantity_on_hand, reorder_threshold, deficit_quantity
FROM vw_low_stock;

PROMPT =========================================================================;
PROMPT VIEW 2: VW_PRODUCT_STOCK (Enterprise Inventory Valuation Snapshot)
PROMPT =========================================================================;
COLUMN sku FORMAT A12 HEADING "SKU";
COLUMN product_name FORMAT A28 HEADING "PRODUCT_NAME";
COLUMN category_name FORMAT A18 HEADING "CATEGORY";
COLUMN warehouse_stock FORMAT 9999 HEADING "WH_QTY";
COLUMN shelf_stock FORMAT 9999 HEADING "SH_QTY";
COLUMN total_stock_on_hand FORMAT 9999 HEADING "TOT_QTY";
COLUMN total_inventory_value FORMAT 999990.99 HEADING "TOTAL_VAL";

SELECT sku, SUBSTR(product_name, 1, 28) AS product_name, SUBSTR(category_name, 1, 18) AS category_name,
       warehouse_stock, shelf_stock, total_stock_on_hand, total_inventory_value
FROM vw_product_stock
WHERE ROWNUM <= 6;
