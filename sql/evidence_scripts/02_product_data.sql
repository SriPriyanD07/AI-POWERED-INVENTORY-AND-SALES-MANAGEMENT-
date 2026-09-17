-- 02_product_data.sql: Formatted Product Master Data
SET LINESIZE 160 PAGESIZE 50 FEEDBACK ON;
COLUMN product_id FORMAT 9999 HEADING "ID";
COLUMN sku FORMAT A12 HEADING "SKU";
COLUMN barcode FORMAT A14 HEADING "BARCODE";
COLUMN product_name FORMAT A28 HEADING "PRODUCT_NAME";
COLUMN category_id FORMAT 9999 HEADING "CAT";
COLUMN unit_of_measure FORMAT A10 HEADING "UOM";
COLUMN standard_unit_price FORMAT 9990.99 HEADING "PRICE";
COLUMN is_active FORMAT A6 HEADING "ACTIVE";

SELECT product_id, sku, barcode, SUBSTR(product_name, 1, 28) AS product_name, category_id,
       unit_of_measure, standard_unit_price, is_active
FROM Product
ORDER BY product_id;
