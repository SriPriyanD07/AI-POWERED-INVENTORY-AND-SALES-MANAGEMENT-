-- 04_multi_table_join.sql: 5-Table Join (POS Sales Receipts)
SET LINESIZE 160 PAGESIZE 50 FEEDBACK ON;
COLUMN receipt_no FORMAT A17 HEADING "RECEIPT_NO";
COLUMN sale_date FORMAT A10 HEADING "DATE";
COLUMN cashier FORMAT A20 HEADING "CASHIER";
COLUMN product FORMAT A24 HEADING "PRODUCT";
COLUMN category FORMAT A16 HEADING "CATEGORY";
COLUMN shelf FORMAT A14 HEADING "SHELF";
COLUMN qty FORMAT 999 HEADING "QTY";
COLUMN price FORMAT 9990.99 HEADING "PRICE";
COLUMN total FORMAT 99990.99 HEADING "TOTAL";

SELECT st.receipt_number AS receipt_no,
       TO_CHAR(st.transaction_date, 'YYYY-MM-DD') AS sale_date,
       SUBSTR(e.full_name, 1, 20) AS cashier,
       SUBSTR(p.product_name, 1, 24) AS product,
       SUBSTR(c.category_name, 1, 16) AS category,
       loc.location_code AS shelf,
       stl.quantity_sold AS qty,
       stl.unit_price AS price,
       (stl.quantity_sold * stl.unit_price) AS total
FROM SalesTransaction st
JOIN Employee e ON st.cashier_id = e.employee_id
JOIN SalesTransactionLine stl ON st.transaction_id = stl.transaction_id
JOIN Product p ON stl.product_id = p.product_id
JOIN ProductCategory c ON p.category_id = c.category_id
JOIN InventoryLocation loc ON stl.shelf_location_id = loc.location_id
WHERE ROWNUM <= 6
ORDER BY st.transaction_id, stl.product_id;

