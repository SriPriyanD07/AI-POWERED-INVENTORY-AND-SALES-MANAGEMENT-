-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 05_joins_aggregations.sql
-- DESCRIPTION: Joins (INNER, LEFT, MULTI-TABLE, SELF) and Aggregations
--              (COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING).
-- =============================================================================

SET PAGESIZE 50;
SET LINESIZE 140;
COLUMN category_name FORMAT A25;
COLUMN parent_category_name FORMAT A25;
COLUMN product_name FORMAT A30;
COLUMN supplier_name FORMAT A28;
COLUMN customer_name FORMAT A25;
COLUMN location_name FORMAT A30;
COLUMN parent_warehouse FORMAT A30;

PROMPT =========================================================================;
PROMPT EXECUTING 05_joins_aggregations.sql — Joins and Aggregations
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. INNER JOIN
-- Description: Join Product with ProductCategory to display catalog details.
-- -----------------------------------------------------------------------------
PROMPT === 1. INNER JOIN: Products and their Assigned Categories ===
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    p.standard_unit_price
FROM Product p
INNER JOIN ProductCategory c ON p.category_id = c.category_id
ORDER BY c.category_name, p.product_name;

-- -----------------------------------------------------------------------------
-- 2. LEFT OUTER JOIN
-- Description: List all Customers along with total sales count and total amount spent,
--              ensuring customers who made 0 purchases are still included.
-- -----------------------------------------------------------------------------
PROMPT === 2. LEFT JOIN: All Customers and their Purchase Activity ===
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.membership_type,
    c.loyalty_points,
    COUNT(s.transaction_id) AS total_orders,
    NVL(SUM(s.total_amount), 0) AS total_spend
FROM Customer c
LEFT JOIN SalesTransaction s ON c.customer_id = s.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.membership_type, c.loyalty_points
ORDER BY total_spend DESC;

-- -----------------------------------------------------------------------------
-- 3. MULTI-TABLE JOIN (5 Tables)
-- Description: Join SalesTransaction, SalesTransactionLine, Product, ProductCategory,
--              and InventoryLocation to detail every item sold and where it came from.
-- -----------------------------------------------------------------------------
PROMPT === 3. MULTI-TABLE JOIN: Detailed POS Sales Receipts with Shelf Location ===
SELECT 
    st.receipt_number,
    st.transaction_date,
    p.sku,
    p.product_name,
    cat.category_name,
    loc.location_name AS shelf_dispensed_from,
    stl.quantity_sold,
    stl.unit_price,
    (stl.quantity_sold * stl.unit_price) AS line_subtotal
FROM SalesTransaction st
INNER JOIN SalesTransactionLine stl ON st.transaction_id = stl.transaction_id
INNER JOIN Product p                ON stl.product_id = p.product_id
INNER JOIN ProductCategory cat      ON p.category_id = cat.category_id
INNER JOIN InventoryLocation loc    ON stl.shelf_location_id = loc.location_id
ORDER BY st.receipt_number, p.product_name;

-- -----------------------------------------------------------------------------
-- 4. SELF JOIN (Example 1: ProductCategory Hierarchy)
-- Description: Join ProductCategory to itself to show Subcategory -> Parent Category.
-- -----------------------------------------------------------------------------
PROMPT === 4a. SELF JOIN: ProductCategory Subcategory -> Parent Category ===
SELECT 
    child.category_id,
    child.category_name AS subcategory_name,
    parent.category_id  AS parent_id,
    parent.category_name AS parent_category_name
FROM ProductCategory child
INNER JOIN ProductCategory parent ON child.parent_category_id = parent.category_id
ORDER BY parent.category_name, child.category_name;

-- -----------------------------------------------------------------------------
-- 5. SELF JOIN (Example 2: InventoryLocation Hierarchy)
-- Description: Join InventoryLocation to itself to show Shelf -> Parent Warehouse.
-- -----------------------------------------------------------------------------
PROMPT === 4b. SELF JOIN: InventoryLocation Shelf -> Parent Warehouse ===
SELECT 
    shelf.location_id    AS shelf_id,
    shelf.location_code  AS shelf_code,
    shelf.location_name  AS shelf_name,
    shelf.aisle_number,
    wh.location_code     AS parent_wh_code,
    wh.location_name     AS parent_warehouse
FROM InventoryLocation shelf
LEFT JOIN InventoryLocation wh ON shelf.parent_location_id = wh.location_id
WHERE shelf.location_type = 'SHELF'
ORDER BY wh.location_code, shelf.location_code;

-- -----------------------------------------------------------------------------
-- 6. AGGREGATE FUNCTIONS: COUNT, SUM, AVG, MIN, MAX
-- Description: Compute overall product catalog pricing statistics.
-- -----------------------------------------------------------------------------
PROMPT === 5. Catalog Aggregation: Product Price Statistics ===
SELECT 
    COUNT(*)                             AS total_products,
    ROUND(AVG(standard_unit_price), 2)   AS avg_unit_price,
    MIN(standard_unit_price)             AS min_unit_price,
    MAX(standard_unit_price)             AS max_unit_price,
    SUM(standard_unit_price)             AS sum_catalog_prices
FROM Product
WHERE is_active = 'TRUE';

-- -----------------------------------------------------------------------------
-- 7. GROUP BY and HAVING
-- Description: Group purchase orders by supplier, calculate order metrics,
--              and filter only suppliers with cumulative PO value >= 20000.
-- -----------------------------------------------------------------------------
PROMPT === 6. GROUP BY & HAVING: Suppliers with Total Purchase Orders >= 20,000 ===
SELECT 
    s.supplier_id,
    s.supplier_name,
    COUNT(po.po_id)             AS total_pos_issued,
    SUM(po.total_amount)        AS gross_po_value,
    ROUND(AVG(po.total_amount), 2) AS avg_po_value
FROM Supplier s
INNER JOIN PurchaseOrder po ON s.supplier_id = po.supplier_id
GROUP BY s.supplier_id, s.supplier_name
HAVING SUM(po.total_amount) >= 20000.00
ORDER BY gross_po_value DESC;

-- -----------------------------------------------------------------------------
-- 8. GROUP BY on Inventory Stock Valuation per Location
-- Description: Calculate total stock units and stock inventory count per location.
-- -----------------------------------------------------------------------------
PROMPT === 7. GROUP BY: Stock Counts and Total Units per Storage Location ===
SELECT 
    loc.location_id,
    loc.location_code,
    loc.location_type,
    loc.location_name,
    COUNT(stk.product_id)      AS distinct_skus_held,
    SUM(stk.quantity_on_hand)  AS total_units_stored
FROM InventoryLocation loc
INNER JOIN InventoryStock stk ON loc.location_id = stk.location_id
GROUP BY loc.location_id, loc.location_code, loc.location_type, loc.location_name
ORDER BY total_units_stored DESC;

PROMPT 05_joins_aggregations.sql completed successfully.
