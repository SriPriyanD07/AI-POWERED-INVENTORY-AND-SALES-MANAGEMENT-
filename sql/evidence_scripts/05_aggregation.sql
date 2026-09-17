-- 05_aggregation.sql: Aggregations with GROUP BY and HAVING
SET LINESIZE 150 PAGESIZE 50 FEEDBACK ON;
COLUMN category_name FORMAT A20 HEADING "CATEGORY";
COLUMN total_products FORMAT 9999 HEADING "COUNT";
COLUMN min_price FORMAT 9990.99 HEADING "MIN_PRICE";
COLUMN max_price FORMAT 9990.99 HEADING "MAX_PRICE";
COLUMN avg_price FORMAT 9990.99 HEADING "AVG_PRICE";
COLUMN total_catalog_val FORMAT 99990.99 HEADING "CATALOG_SUM";

SELECT SUBSTR(c.category_name, 1, 20) AS category_name,
       COUNT(p.product_id) AS total_products,
       MIN(p.standard_unit_price) AS min_price,
       MAX(p.standard_unit_price) AS max_price,
       ROUND(AVG(p.standard_unit_price), 2) AS avg_price,
       SUM(p.standard_unit_price) AS total_catalog_val
FROM ProductCategory c
JOIN Product p ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(p.product_id) >= 1
ORDER BY total_products DESC, c.category_name;
