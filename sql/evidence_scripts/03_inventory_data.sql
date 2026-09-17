-- 03_inventory_data.sql: Inventory Location and Stock Balances
SET LINESIZE 160 PAGESIZE 50 FEEDBACK ON;
COLUMN location_code FORMAT A14 HEADING "LOC_CODE";
COLUMN location_type FORMAT A10 HEADING "LOC_TYPE";
COLUMN sku FORMAT A12 HEADING "SKU";
COLUMN product_name FORMAT A28 HEADING "PRODUCT_NAME";
COLUMN quantity_on_hand FORMAT 9999 HEADING "QOH";
COLUMN reorder_threshold FORMAT 9999 HEADING "THRESH";
COLUMN reorder_quantity FORMAT 9999 HEADING "REORD_QTY";

SELECT l.location_code, l.location_type,
       p.sku, SUBSTR(p.product_name, 1, 28) AS product_name,
       s.quantity_on_hand, s.reorder_threshold, s.reorder_quantity
FROM InventoryLocation l
JOIN InventoryStock s ON l.location_id = s.location_id
JOIN Product p ON s.product_id = p.product_id
WHERE ROWNUM <= 8
ORDER BY l.location_id, p.product_id;
