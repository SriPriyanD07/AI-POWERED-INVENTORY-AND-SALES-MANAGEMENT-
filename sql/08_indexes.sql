-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 08_indexes.sql
-- DESCRIPTION: Creation of optimized, non-redundant B-tree indexes for
--              frequent foreign key lookups, date-range filters, and ledgers.
-- =============================================================================

SET PAGESIZE 50;
SET LINESIZE 120;
COLUMN index_name FORMAT A28;
COLUMN table_name FORMAT A25;
COLUMN column_name FORMAT A25;

PROMPT =========================================================================;
PROMPT EXECUTING 08_indexes.sql — Creating Secondary Performance Indexes
PROMPT =========================================================================;

SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

-- -----------------------------------------------------------------------------
-- 1. Index on Product Category FK
-- Purpose: Accelerates category-based product searches and catalog navigations.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_PROD_CATEGORY_ID on Product(category_id) ===
CREATE INDEX IDX_PROD_CATEGORY_ID ON Product(category_id);

-- -----------------------------------------------------------------------------
-- 2. Reverse Index on InventoryStock (Product, Location)
-- Purpose: Accelerates finding all locations stocking a particular product SKU.
-- (Note: PK is location_id, product_id; this index leads with product_id)
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_STOCK_PROD_LOC on InventoryStock(product_id, location_id) ===
CREATE INDEX IDX_STOCK_PROD_LOC ON InventoryStock(product_id, location_id);

-- -----------------------------------------------------------------------------
-- 3. Composite Index on InventoryTransaction Ledger
-- Purpose: Optimizes date-bounded stock audit queries and movements by location.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_INV_TXN_LEDGER on InventoryTransaction(product_id, location_id, transaction_date) ===
CREATE INDEX IDX_INV_TXN_LEDGER ON InventoryTransaction(product_id, location_id, transaction_date);

-- -----------------------------------------------------------------------------
-- 4. Composite Index on SalesTransaction
-- Purpose: Optimizes daily/monthly POS reporting and cashier audit trails.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_SALES_DATE_CASHIER on SalesTransaction(transaction_date, cashier_id) ===
CREATE INDEX IDX_SALES_DATE_CASHIER ON SalesTransaction(transaction_date, cashier_id);

-- -----------------------------------------------------------------------------
-- 5. Composite Index on PurchaseOrder
-- Purpose: Optimizes supplier procurement history and date filtering.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_PO_SUPP_DATE on PurchaseOrder(supplier_id, order_date) ===
CREATE INDEX IDX_PO_SUPP_DATE ON PurchaseOrder(supplier_id, order_date);

-- -----------------------------------------------------------------------------
-- 6. Composite Index on Customer Name
-- Purpose: Optimizes customer name searches at POS checkout.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_CUST_NAME on Customer(last_name, first_name) ===
CREATE INDEX IDX_CUST_NAME ON Customer(last_name, first_name);

-- -----------------------------------------------------------------------------
-- 7. Index on SalesTransactionLine Shelf Location
-- Purpose: Supports spatial analysis of sales dispensed per shelf location.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_STL_SHELF on SalesTransactionLine(shelf_location_id) ===
CREATE INDEX IDX_STL_SHELF ON SalesTransactionLine(shelf_location_id);

-- -----------------------------------------------------------------------------
-- 8. Composite Index on Payment
-- Purpose: Speeds up settlement reconciliations by transaction and payment method.
-- -----------------------------------------------------------------------------
PROMPT === Creating IDX_PAYMENT_TXN on Payment(transaction_id, payment_method) ===
CREATE INDEX IDX_PAYMENT_TXN ON Payment(transaction_id, payment_method);

-- -----------------------------------------------------------------------------
-- VERIFICATION: List all non-unique custom indexes created
-- -----------------------------------------------------------------------------
PROMPT Verification of Custom Created Indexes:
SELECT 
    i.index_name,
    i.table_name,
    i.uniqueness,
    i.status
FROM user_indexes i
WHERE i.index_name IN (
    'IDX_PROD_CATEGORY_ID',
    'IDX_STOCK_PROD_LOC',
    'IDX_INV_TXN_LEDGER',
    'IDX_SALES_DATE_CASHIER',
    'IDX_PO_SUPP_DATE',
    'IDX_CUST_NAME',
    'IDX_STL_SHELF',
    'IDX_PAYMENT_TXN'
)
ORDER BY i.table_name, i.index_name;

PROMPT 08_indexes.sql completed successfully.
