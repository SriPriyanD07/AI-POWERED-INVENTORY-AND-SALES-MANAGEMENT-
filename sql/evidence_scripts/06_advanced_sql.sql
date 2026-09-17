-- 06_advanced_sql.sql: Analytic Window Functions (RANK & DENSE_RANK)
SET LINESIZE 160 PAGESIZE 50 FEEDBACK ON;
COLUMN category FORMAT A18 HEADING "CATEGORY";
COLUMN product FORMAT A38 HEADING "PRODUCT";
COLUMN price FORMAT 9990.99 HEADING "PRICE";
COLUMN price_rank FORMAT 9999 HEADING "RANK";
COLUMN dense_rank FORMAT 9999999999 HEADING "DENSE_RANK";

SELECT SUBSTR(c.category_name, 1, 18) AS category,
       SUBSTR(p.product_name, 1, 38) AS product,
       p.standard_unit_price AS price,
       RANK() OVER (PARTITION BY p.category_id ORDER BY p.standard_unit_price DESC) AS price_rank,
       DENSE_RANK() OVER (PARTITION BY p.category_id ORDER BY p.standard_unit_price DESC) AS dense_rank
FROM Product p
JOIN ProductCategory c ON p.category_id = c.category_id
WHERE ROWNUM <= 8
ORDER BY category, dense_rank;

