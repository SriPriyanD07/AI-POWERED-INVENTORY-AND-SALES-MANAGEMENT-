-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 06_subqueries_advanced.sql
-- DESCRIPTION: Advanced SQL Subqueries (Single-Row, Multi-Row, Correlated,
--              EXISTS, NOT EXISTS, CASE Expression, Common Table Expression - CTE,
--              and Analytic / Window Functions).
-- =============================================================================

SET PAGESIZE 50;
SET LINESIZE 140;
COLUMN product_name FORMAT A32;
COLUMN category_name FORMAT A25;
COLUMN supplier_name FORMAT A28;
COLUMN customer_name FORMAT A25;
COLUMN stock_health_status FORMAT A20;
COLUMN loyalty_tier_status FORMAT A20;

PROMPT =========================================================================;
PROMPT EXECUTING 06_subqueries_advanced.sql — Advanced SQL & Subqueries
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. SINGLE-ROW SUBQUERY
-- Description: Find all products whose standard unit price is strictly above
--              the overall catalog average price.
-- -----------------------------------------------------------------------------
PROMPT === 1. SINGLE-ROW SUBQUERY: Products Priced Above Average Catalog Price ===
SELECT 
    product_id,
    sku,
    product_name,
    standard_unit_price,
    ROUND((SELECT AVG(standard_unit_price) FROM Product), 2) AS catalog_avg_price
FROM Product
WHERE standard_unit_price > (
    SELECT AVG(standard_unit_price) 
    FROM Product
)
ORDER BY standard_unit_price DESC;

-- -----------------------------------------------------------------------------
-- 2. MULTI-ROW SUBQUERY (IN Operator)
-- Description: Find all suppliers who have orders currently in 'COMPLETED' or 'SHIPPED' status.
-- -----------------------------------------------------------------------------
PROMPT === 2. MULTI-ROW SUBQUERY: Suppliers with Active/Fulfilled Purchase Orders (IN) ===
SELECT 
    supplier_id,
    supplier_name,
    city,
    rating
FROM Supplier
WHERE supplier_id IN (
    SELECT supplier_id 
    FROM PurchaseOrder 
    WHERE status IN ('COMPLETED', 'SHIPPED')
)
ORDER BY rating DESC;

-- -----------------------------------------------------------------------------
-- 3. CORRELATED SUBQUERY
-- Description: Find products whose price is strictly greater than the average
--              price of products within their own specific product category.
-- -----------------------------------------------------------------------------
PROMPT === 3. CORRELATED SUBQUERY: Products Priced Above Their Category Average ===
SELECT 
    p1.product_id,
    p1.sku,
    p1.product_name,
    p1.category_id,
    p1.standard_unit_price,
    ROUND((
        SELECT AVG(p2.standard_unit_price)
        FROM Product p2
        WHERE p2.category_id = p1.category_id
    ), 2) AS category_avg_price
FROM Product p1
WHERE p1.standard_unit_price > (
    SELECT AVG(p2.standard_unit_price)
    FROM Product p2
    WHERE p2.category_id = p1.category_id
)
ORDER BY p1.category_id, p1.standard_unit_price DESC;

-- -----------------------------------------------------------------------------
-- 4. EXISTS OPERATOR
-- Description: Find all suppliers who have at least one verified delivered shipment.
-- -----------------------------------------------------------------------------
PROMPT === 4. EXISTS: Suppliers with at least one Verified Received Shipment ===
SELECT 
    s.supplier_id,
    s.supplier_name,
    s.gst_number,
    s.city
FROM Supplier s
WHERE EXISTS (
    SELECT 1 
    FROM PurchaseOrder po
    INNER JOIN Shipment sh ON po.po_id = sh.po_id
    WHERE po.supplier_id = s.supplier_id
      AND sh.status = 'RECEIVED'
);

-- -----------------------------------------------------------------------------
-- 5. NOT EXISTS OPERATOR
-- Description: Find registered customers who have never placed a sales transaction.
-- -----------------------------------------------------------------------------
PROMPT === 5. NOT EXISTS: Registered Customers with Zero Orders (Inactive) ===
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    c.membership_type,
    c.registered_date
FROM Customer c
WHERE NOT EXISTS (
    SELECT 1 
    FROM SalesTransaction st 
    WHERE st.customer_id = c.customer_id
);

-- -----------------------------------------------------------------------------
-- 6. CASE EXPRESSION
-- Description: Evaluate live inventory stock health based on quantity_on_hand
--              relative to reorder_threshold.
-- -----------------------------------------------------------------------------
PROMPT === 6. CASE EXPRESSION: Dynamic Stock Health Assessment ===
SELECT 
    loc.location_code,
    loc.location_type,
    p.product_name,
    stk.quantity_on_hand,
    stk.reorder_threshold,
    CASE 
        WHEN stk.quantity_on_hand = 0 THEN 'OUT OF STOCK'
        WHEN stk.quantity_on_hand <= stk.reorder_threshold THEN 'CRITICAL - REORDER'
        WHEN stk.quantity_on_hand <= (stk.reorder_threshold * 2) THEN 'LOW - MONITOR'
        ELSE 'HEALTHY BUFFER'
    END AS stock_health_status
FROM InventoryStock stk
INNER JOIN Product p            ON stk.product_id = p.product_id
INNER JOIN InventoryLocation loc ON stk.location_id = loc.location_id
ORDER BY loc.location_type, stk.quantity_on_hand ASC;

-- -----------------------------------------------------------------------------
-- 7. COMMON TABLE EXPRESSION (WITH Clause / CTE)
-- Description: Compute total product sales revenue and units sold, then join
--              with product details to rank revenue performance.
-- -----------------------------------------------------------------------------
PROMPT === 7. CTE (WITH Clause): Product Sales Revenue Performance ===
WITH ProductSalesSummary AS (
    SELECT 
        stl.product_id,
        SUM(stl.quantity_sold) AS total_units_sold,
        SUM(stl.quantity_sold * stl.unit_price) AS gross_revenue
    FROM SalesTransactionLine stl
    INNER JOIN SalesTransaction st ON stl.transaction_id = st.transaction_id
    WHERE st.status = 'COMPLETED'
    GROUP BY stl.product_id
)
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    pss.total_units_sold,
    pss.gross_revenue,
    ROUND((pss.gross_revenue / (SELECT SUM(gross_revenue) FROM ProductSalesSummary)) * 100, 2) AS revenue_pct
FROM Product p
INNER JOIN ProductSalesSummary pss ON p.product_id = pss.product_id
ORDER BY pss.gross_revenue DESC;

-- -----------------------------------------------------------------------------
-- 8. ANALYTIC / WINDOW FUNCTION (RANK & DENSE_RANK)
-- Description: Rank products by price within their respective product categories.
-- -----------------------------------------------------------------------------
PROMPT === 8. WINDOW FUNCTION: Ranking Products by Price within Category ===
SELECT 
    cat.category_name,
    p.product_name,
    p.standard_unit_price,
    RANK() OVER (
        PARTITION BY p.category_id 
        ORDER BY p.standard_unit_price DESC
    ) AS price_rank_in_cat,
    DENSE_RANK() OVER (
        ORDER BY p.standard_unit_price DESC
    ) AS overall_price_dense_rank
FROM Product p
INNER JOIN ProductCategory cat ON p.category_id = cat.category_id
ORDER BY cat.category_name, price_rank_in_cat;

PROMPT 06_subqueries_advanced.sql completed successfully.
