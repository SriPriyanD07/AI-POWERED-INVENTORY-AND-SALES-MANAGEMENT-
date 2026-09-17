# SmartRetail DA2 — Commands & Features Checklist

This document tracks every SQL and PL/SQL command, constraint, and operational feature required for the **SmartRetail (DA2)** university project, cross-referenced with the implementing script and verification status.

---

## 1. DDL & Data Definition Language

| Required Feature | SQL Command / Syntax | Implementing File | Verification Status |
|---|---|---|---|
| **CREATE TABLE** | `CREATE TABLE <name> (...)` | `sql/01_schema.sql` | Verified across all 19 relations |
| **ALTER TABLE** | `ALTER TABLE <name> ADD CONSTRAINT ...` | `sql/02_constraints.sql` | Verified for all PK/FK/UK/CK |
| **DROP TABLE** | `DROP TABLE <name> CASCADE CONSTRAINTS PURGE` | `sql/00_reset.sql` | Verified in teardown block |
| **CREATE SEQUENCE** | `CREATE SEQUENCE <name> START WITH 1 ...` | `sql/01_schema.sql` | 13 Sequences created & synchronized |
| **CREATE INDEX** | `CREATE INDEX <name> ON <table>(<cols>)` | `sql/08_indexes.sql` | 8 Custom B-Tree indexes created |
| **CREATE VIEW** | `CREATE OR REPLACE VIEW <name> AS SELECT ...` | `sql/07_views.sql` | 5 Business views created & queried |

---

## 2. Integrity Constraints

| Constraint Type | Approved Pattern / Name | Implementing File | Verification Status |
|---|---|---|---|
| **PRIMARY KEY (Single)** | `PK_SUPPLIER`, `PK_PRODUCT`, `PK_CUSTOMER` | `sql/01_schema.sql` | Verified on 14 master/transaction tables |
| **PRIMARY KEY (Composite)** | `PK_SUPPLIER_PHONE`, `PK_PURCHASE_ORDER_LINE`, `PK_SHIPMENT_LINE`, `PK_INVENTORY_STOCK`, `PK_CUSTOMER_PHONE`, `PK_SALES_TRANSACTION_LINE` | `sql/01_schema.sql` | Verified on 5 composite key relations |
| **FOREIGN KEY (1:N)** | `FK_PROD_CATEGORY`, `FK_PO_SUPPLIER`, `FK_SHP_PO`, `FK_SALES_CUSTOMER`, `FK_PAYMENT_TRANSACTION` | `sql/02_constraints.sql` | Verified with exact constraint names |
| **FOREIGN KEY (Recursive)** | `FK_CAT_PARENT` on `ProductCategory`, `FK_LOC_PARENT` on `InventoryLocation` | `sql/02_constraints.sql` | Verified with `ON DELETE SET NULL` |
| **FOREIGN KEY (Cascade)** | `ON DELETE CASCADE` on `SupplierPhone`, `CustomerPhone`, `PurchaseOrderLine`, `ShipmentLine`, `SalesTransactionLine` | `sql/02_constraints.sql` | Verified for weak/dependent entities |
| **UNIQUE KEY** | `UK_SUPPLIER_EMAIL`, `UK_SUPPLIER_GST`, `UK_PRODUCT_SKU`, `UK_PRODUCT_BARCODE`, `UK_PO_NUMBER`, `UK_SHIPMENT_TRACKING`, `UK_LOCATION_CODE`, `UK_CUSTOMER_EMAIL`, `UK_SALES_RECEIPT` | `sql/02_constraints.sql` | Verified; duplicate inserts blocked |
| **NOT NULL** | Mandatory relational attributes | `sql/01_schema.sql` | Verified on all required fields |
| **CHECK (Domain Values)** | `CK_EMPLOYEE_ROLE`, `CK_PO_STATUS`, `CK_SHIPMENT_STATUS`, `CK_LOCATION_TYPE`, `CK_ITXN_TYPE`, `CK_RESTOCK_STATUS`, `CK_REORDER_STATUS`, `CK_MEMBERSHIP_TYPE`, `CK_SALES_STATUS`, `CK_PAYMENT_METHOD` | `sql/02_constraints.sql` | Verified against approved lists |
| **CHECK (Numeric Ranges)** | `CK_PRODUCT_PRICE` (>0), `CK_POL_QTY` (>0), `CK_STOCK_QOH` (>=0), `CK_PAYMENT_AMOUNT` (>0), `CK_SUPPLIER_RATING` (1.0 to 5.0) | `sql/02_constraints.sql` | Verified; negative values rejected |
| **DEFAULT** | `DEFAULT SYSDATE`, `DEFAULT SYSTIMESTAMP`, `DEFAULT 0`, `DEFAULT 'TRUE'`, `DEFAULT 'FALSE'` | `sql/01_schema.sql` | Verified across tables |

---

## 3. DML & SQL Queries

| Query / Operation | Syntax / Feature Demonstrated | Implementing File | Verification Status |
|---|---|---|---|
| **INSERT** | Single-row inserts, multi-table population | `sql/03_sample_data.sql` | Verified; 100+ seed records loaded |
| **UPDATE** | Single-row and conditioned column updates | `sql/04_basic_queries.sql` | Verified on Supplier rating |
| **DELETE** | Safe deletion of temporary row with verification | `sql/04_basic_queries.sql` | Verified on test customer record |
| **SELECT** | Basic data retrieval with column projection | `sql/04_basic_queries.sql` | Verified |
| **WHERE** | Relational filtering with numeric & string predicates | `sql/04_basic_queries.sql` | Verified |
| **ORDER BY** | Ascending and descending multi-column sort | `sql/04_basic_queries.sql` | Verified |
| **DISTINCT** | Unique value extraction across rows | `sql/04_basic_queries.sql` | Verified on `unit_of_measure` |
| **LIKE** | Wildcard prefix and substring matching (`H%`, `%agro%`) | `sql/04_basic_queries.sql` | Verified |
| **IN** | Discrete set membership check | `sql/04_basic_queries.sql` | Verified on Employee roles |
| **BETWEEN** | Closed interval range filtering | `sql/04_basic_queries.sql` | Verified on product pricing |
| **IS NULL / IS NOT NULL** | Nullity checks for guest checkout & root categories | `sql/04_basic_queries.sql` | Verified on `customer_id`, `parent_category_id` |

---

## 4. Joins & Aggregations

| Area | Feature Demonstrated | Implementing File | Verification Status |
|---|---|---|---|
| **INNER JOIN** | `Product` joined with `ProductCategory` | `sql/05_joins_aggregations.sql` | Verified |
| **LEFT JOIN** | All `Customer` rows with sales aggregations (including 0 sales) | `sql/05_joins_aggregations.sql` | Verified |
| **MULTI-TABLE JOIN** | 5-table join (`SalesTransaction` -> `Line` -> `Product` -> `Category` -> `Location`) | `sql/05_joins_aggregations.sql` | Verified |
| **SELF JOIN** | Hierarchical categories (`ProductCategory` child to parent) & Location hierarchy (`Shelf` to `Warehouse`) | `sql/05_joins_aggregations.sql` | Verified |
| **COUNT, SUM, AVG, MIN, MAX** | Statistical pricing aggregations across active catalog | `sql/05_joins_aggregations.sql` | Verified |
| **GROUP BY** | Grouping sales and inventory by store location & supplier | `sql/05_joins_aggregations.sql` | Verified |
| **HAVING** | Post-aggregation filtering on total supplier spend >= 20,000 | `sql/05_joins_aggregations.sql` | Verified |

---

## 5. Advanced SQL & Subqueries

| Area | Feature Demonstrated | Implementing File | Verification Status |
|---|---|---|---|
| **Single-Row Subquery** | Products priced above overall catalog average | `sql/06_subqueries_advanced.sql` | Verified |
| **Multi-Row Subquery** | Suppliers with orders in specific status (`IN (SELECT ...)`) | `sql/06_subqueries_advanced.sql` | Verified |
| **Correlated Subquery** | Products priced above their own category's average | `sql/06_subqueries_advanced.sql` | Verified |
| **EXISTS** | Suppliers with at least one verified delivered shipment | `sql/06_subqueries_advanced.sql` | Verified |
| **NOT EXISTS** | Inactive customers who have never placed an order | `sql/06_subqueries_advanced.sql` | Verified |
| **CASE Expression** | Live inventory health evaluator (`CRITICAL`, `LOW`, `HEALTHY`) | `sql/06_subqueries_advanced.sql` | Verified |
| **CTE (WITH Clause)** | Product sales summary ranking revenue share | `sql/06_subqueries_advanced.sql` | Verified |
| **Window Functions** | `RANK()` and `DENSE_RANK()` by category partition | `sql/06_subqueries_advanced.sql` | Verified |

---

## 6. PL/SQL Program Units

| Unit Type | Object Name | Purpose | Implementing File | Verification Status |
|---|---|---|---|---|
| **Procedure** | `PROCESS_SALE` | POS checkout: validates shelf stock, creates sale header & line, decrements shelf stock, logs `SALE` ledger row, computes total | `sql/09_procedures.sql` | Verified |
| **Procedure** | `RECEIVE_SHIPMENT` | Inbound receiving: validates shipment, updates warehouse stock, logs `RECEIPT` ledger rows, updates PO/Shipment status | `sql/09_procedures.sql` | Verified |
| **Procedure** | `TRANSFER_STOCK` | Restocking: transfers stock from warehouse to shelf, logs `TRANSFER_OUT` & `TRANSFER_IN` ledger rows, records `RestockEvent` | `sql/09_procedures.sql` | Verified |
| **Procedure** | `CREATE_PURCHASE_ORDER` | Procurement: validates vendor, creates PO header & line, calculates total amount | `sql/09_procedures.sql` | Verified |
| **Function** | `CALCULATE_SALE_TOTAL` | Returns total monetary value of lines for a transaction | `sql/10_functions.sql` | Verified |
| **Function** | `CALCULATE_STOCK_VALUE` | Returns total asset valuation of a product (enterprise or location) | `sql/10_functions.sql` | Verified |
| **Function** | `CALCULATE_LOYALTY_POINTS` | [OPTIONAL / DEMONSTRATION ONLY] Academic PL/SQL demo of numeric return; not an approved business rule | `sql/10_functions.sql` | Verified (Demo Only) |
| **Cursor** | Explicit Cursor | Inventory stock audit with `OPEN`, `FETCH`, `%NOTFOUND`, `CLOSE` | `sql/11_cursors.sql` | Verified |
| **Cursor** | Cursor FOR Loop | Daily sales reconciliation iterating completed receipts | `sql/11_cursors.sql` | Verified |
| **Cursor** | Parameterized Cursor | Category product inspector accepting dynamic category ID | `sql/11_cursors.sql` | Verified |
| **Exception** | `NO_DATA_FOUND` | Querying non-existent customer ID | `sql/12_exceptions.sql` | Verified |
| **Exception** | `TOO_MANY_ROWS` | Single-row SELECT on shared cashier role | `sql/12_exceptions.sql` | Verified |
| **Exception** | `DUP_VAL_ON_INDEX` | Inserting duplicate unique SKU | `sql/12_exceptions.sql` | Verified |
| **Exception** | `OTHERS` | Catch-all handler with `SQLCODE` and `SQLERRM` | `sql/12_exceptions.sql` | Verified |
| **Exception** | User-Defined | `ex_capacity_exceeded` / `ex_insufficient_stock` | `sql/12_exceptions.sql` | Verified |
| **Trigger** | `TRG_PO_LINE_TOTAL_SYNC` | Automatically synchronizes `PurchaseOrder.total_amount` | `sql/13_triggers.sql` | Verified |
| **Trigger** | `TRG_SALE_LINE_TOTAL_SYNC` | Automatically synchronizes `SalesTransaction.total_amount` | `sql/13_triggers.sql` | Verified |
| **Trigger** | `TRG_STOCK_THRESHOLD_ALERT` | Auto-creates `RestockEvent` (Shelf) & `ReorderTrigger` (Warehouse) | `sql/13_triggers.sql` | Verified |
| **Trigger** | `TRG_PREVENT_NEGATIVE_STOCK` | Database-level defense against negative stock | `sql/13_triggers.sql` | Verified |

---

## 7. Transaction Control (ACID)

| Feature | Scenario Demonstrated | Implementing File | Verification Status |
|---|---|---|---|
| **COMMIT** | Multi-step POS sale (header + line + payment + stock deduction + ledger) made permanent | `sql/14_transactions.sql` | Verified |
| **ROLLBACK** | Payment authorization decline rolling back all uncommitted mutations | `sql/14_transactions.sql` | Verified |
| **SAVEPOINT** | Multi-item basket checkout with intermediate checkpoint | `sql/14_transactions.sql` | Verified |
| **ROLLBACK TO SAVEPOINT** | Customer declines secondary item; partial rollback preserves primary item | `sql/14_transactions.sql` | Verified |
