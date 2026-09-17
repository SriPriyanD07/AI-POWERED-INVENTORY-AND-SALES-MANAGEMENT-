-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 07_views.sql
-- DESCRIPTION: Creation and verification of the 5 required SmartRetail views:
--              1. vw_low_stock
--              2. vw_product_stock
--              3. vw_monthly_sales
--              4. vw_top_selling_products
--              5. vw_supplier_performance
-- =============================================================================

SET PAGESIZE 50;
SET LINESIZE 140;
COLUMN product_name FORMAT A30;
COLUMN location_name FORMAT A28;
COLUMN category_name FORMAT A22;
COLUMN supplier_name FORMAT A28;

PROMPT =========================================================================;
PROMPT EXECUTING 07_views.sql — Creating and Querying Approved Views
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. VIEW: vw_low_stock
-- Description: Identifies any storage location where live stock is at or below
--              the defined reorder threshold, indicating immediate action needed.
-- -----------------------------------------------------------------------------
PROMPT === Creating VIEW: vw_low_stock ===
CREATE OR REPLACE VIEW vw_low_stock AS
SELECT 
    loc.location_id,
    loc.location_code,
    loc.location_type,
    loc.location_name,
    p.product_id,
    p.sku,
    p.product_name,
    stk.quantity_on_hand,
    stk.reorder_threshold,
    stk.reorder_quantity,
    (stk.reorder_threshold - stk.quantity_on_hand) AS deficit_quantity,
    stk.last_updated_at
FROM InventoryStock stk
INNER JOIN InventoryLocation loc ON stk.location_id = loc.location_id
INNER JOIN Product p             ON stk.product_id = p.product_id
WHERE stk.quantity_on_hand <= stk.reorder_threshold;

PROMPT Querying vw_low_stock:
SELECT * FROM vw_low_stock;

-- -----------------------------------------------------------------------------
-- 2. VIEW: vw_product_stock
-- Description: Master inventory view aggregating warehouse units, shelf units,
--              total company inventory, and total asset valuation per product.
-- -----------------------------------------------------------------------------
PROMPT === Creating VIEW: vw_product_stock ===
CREATE OR REPLACE VIEW vw_product_stock AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    cat.category_name,
    p.standard_unit_price,
    NVL(SUM(CASE WHEN loc.location_type = 'WAREHOUSE' THEN stk.quantity_on_hand ELSE 0 END), 0) AS warehouse_stock,
    NVL(SUM(CASE WHEN loc.location_type = 'SHELF'     THEN stk.quantity_on_hand ELSE 0 END), 0) AS shelf_stock,
    NVL(SUM(stk.quantity_on_hand), 0) AS total_stock_on_hand,
    ROUND(NVL(SUM(stk.quantity_on_hand * p.standard_unit_price), 0), 2) AS total_inventory_value
FROM Product p
INNER JOIN ProductCategory cat   ON p.category_id = cat.category_id
LEFT JOIN InventoryStock stk     ON p.product_id = stk.product_id
LEFT JOIN InventoryLocation loc  ON stk.location_id = loc.location_id
GROUP BY p.product_id, p.sku, p.product_name, cat.category_name, p.standard_unit_price;

PROMPT Querying vw_product_stock:
SELECT * FROM vw_product_stock ORDER BY product_id;

-- -----------------------------------------------------------------------------
-- 3. VIEW: vw_monthly_sales
-- Description: Aggregates sales volume, customer footfall, gross receipts, and
--              average basket size broken down by sales period (Year-Month).
-- -----------------------------------------------------------------------------
PROMPT === Creating VIEW: vw_monthly_sales ===
CREATE OR REPLACE VIEW vw_monthly_sales AS
SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM')   AS sales_month,
    COUNT(transaction_id)                 AS total_sales_transactions,
    COUNT(DISTINCT customer_id)           AS unique_registered_shoppers,
    SUM(total_amount)                     AS gross_sales_revenue,
    ROUND(AVG(total_amount), 2)           AS average_order_value,
    MIN(total_amount)                     AS min_order_value,
    MAX(total_amount)                     AS max_order_value
FROM SalesTransaction
WHERE status = 'COMPLETED'
GROUP BY TO_CHAR(transaction_date, 'YYYY-MM');

PROMPT Querying vw_monthly_sales:
SELECT * FROM vw_monthly_sales;

-- -----------------------------------------------------------------------------
-- 4. VIEW: vw_top_selling_products
-- Description: Ranks products by units sold and gross sales revenue.
-- -----------------------------------------------------------------------------
PROMPT === Creating VIEW: vw_top_selling_products ===
CREATE OR REPLACE VIEW vw_top_selling_products AS
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    cat.category_name,
    COUNT(DISTINCT stl.transaction_id)          AS orders_count,
    SUM(stl.quantity_sold)                      AS total_units_sold,
    SUM(stl.quantity_sold * stl.unit_price)     AS total_sales_revenue
FROM SalesTransactionLine stl
INNER JOIN SalesTransaction st ON stl.transaction_id = st.transaction_id
INNER JOIN Product p           ON stl.product_id = p.product_id
INNER JOIN ProductCategory cat ON p.category_id = cat.category_id
WHERE st.status = 'COMPLETED'
GROUP BY p.product_id, p.sku, p.product_name, cat.category_name;

PROMPT Querying vw_top_selling_products:
SELECT * FROM vw_top_selling_products ORDER BY total_sales_revenue DESC;

-- -----------------------------------------------------------------------------
-- 5. VIEW: vw_supplier_performance
-- Description: Evaluates suppliers across PO volume, total procurement spend,
--              received deliveries, and vendor ratings.
-- -----------------------------------------------------------------------------
PROMPT === Creating VIEW: vw_supplier_performance ===
CREATE OR REPLACE VIEW vw_supplier_performance AS
SELECT 
    s.supplier_id,
    s.supplier_name,
    s.contact_person,
    s.rating,
    COUNT(DISTINCT po.po_id)             AS total_pos_placed,
    NVL(SUM(po.total_amount), 0)         AS total_procurement_spend,
    COUNT(DISTINCT sh.shipment_id)       AS shipments_received
FROM Supplier s
LEFT JOIN PurchaseOrder po ON s.supplier_id = po.supplier_id
LEFT JOIN Shipment sh      ON po.po_id = sh.po_id AND sh.status = 'RECEIVED'
GROUP BY s.supplier_id, s.supplier_name, s.contact_person, s.rating;

PROMPT Querying vw_supplier_performance:
SELECT * FROM vw_supplier_performance ORDER BY total_procurement_spend DESC;

PROMPT 07_views.sql completed successfully.
