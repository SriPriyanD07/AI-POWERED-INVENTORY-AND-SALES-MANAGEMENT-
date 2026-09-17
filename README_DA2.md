# SmartRetail: AI-Powered Inventory and Sales Management System
## University DBMS Mini-Project — DA2 Complete Implementation

**Institution:** Department of Computer Science & Engineering  
**Course:** Database Management Systems (DBMS)  
**Deliverable:** Digital Assignment 2 (DA2) — SQL & PL/SQL Implementation  
**Target RDBMS:** Oracle Database 11g / 12c / 19c / 21c / 23c  
**Execution User:** `SYSTEM` (or explicitly designated project user)  
**Source of Truth:** `SmartRetail_DA2_Antigravity_Handoff.docx` & Approved DA1 EER Model  

---

## 1. Executive Summary

**SmartRetail** is an enterprise-grade, normalized relational database architecture designed to eliminate data silos, automate procurement, enforce real-time multi-location inventory synchronization (warehouses and retail shelves), support complex point-of-sale (POS) split-tender transactions, and maintain an immutable stock audit ledger.

The database strictly implements the **19 relations** approved in DA1, adhering to Boyce-Codd Normal Form (BCNF) principles while providing the foundational data architecture required for predictive restocking and AI-driven retail operations.

---

## 2. Project Directory Structure

```
D:\PROJECTS\DBMS
│
├── docs
│   └── SmartRetail_DA2_Antigravity_Handoff.docx   # Approved DA2 handoff brief
│
├── sql
│   ├── 00_reset.sql                               # Clean teardown of objects & sequences
│   ├── 01_schema.sql                              # Sequences, 19 tables, and auto-ID triggers
│   ├── 02_constraints.sql                         # PKs, FKs, Unique, and Domain Check constraints
│   ├── 03_sample_data.sql                         # Seed data for all 19 tables & sequence sync
│   ├── 04_basic_queries.sql                       # SELECT, WHERE, ORDER BY, LIKE, IN, NULL, DML
│   ├── 05_joins_aggregations.sql                  # INNER, LEFT, MULTI-TABLE, SELF joins, GROUP BY, HAVING
│   ├── 06_subqueries_advanced.sql                 # Correlated subqueries, EXISTS, CASE, CTE, Window functions
│   ├── 07_views.sql                               # 5 Approved business views with SELECT queries
│   ├── 08_indexes.sql                             # Non-redundant performance B-Tree indexes
│   ├── 09_procedures.sql                          # PROCESS_SALE, RECEIVE_SHIPMENT, TRANSFER_STOCK, CREATE_PO
│   ├── 10_functions.sql                           # Core: CALCULATE_SALE_TOTAL, STOCK_VALUE; Demo: LOYALTY_POINTS
│   ├── 11_cursors.sql                             # Explicit cursor, Cursor FOR Loop, Parameterized cursor
│   ├── 12_exceptions.sql                          # NO_DATA_FOUND, TOO_MANY_ROWS, DUP_VAL, OTHERS, Custom
│   ├── 13_triggers.sql                            # PO total sync, Sale total sync, Restock/Reorder alerts
│   ├── 14_transactions.sql                        # COMMIT, ROLLBACK, SAVEPOINT demonstrations
│   ├── 15_test_cases.sql                          # 13-part automated integrity & regression test suite
│   └── run_all.sql                                # Master driver script with log spooling
│
├── output
│   └── execution_logs                             # Execution output logs (run_all.log)
│
├── IMPLEMENTATION_AUDIT.md                        # Audit of existing workspace & conflict resolution
├── TESTING.md                                     # Verification methodology & test case matrix
├── README_DA2.md                                  # Complete project documentation (this file)
└── DA2_COMMANDS_CHECKLIST.md                      # Command-by-command compliance checklist
```

---

## 3. Approved 19-Relation Relational Schema

| # | Relation Name | Primary Key | Foreign Keys | Key Attributes |
|---|---|---|---|---|
| 1 | **Supplier** | `supplier_id` | — | `supplier_name`, `email` (UK), `gst_number` (UK), `street`, `city`, `state`, `pincode`, `rating` |
| 2 | **SupplierPhone** | `(supplier_id, phone_number)` | `supplier_id` → `Supplier` | Multi-valued phone numbers in 1NF |
| 3 | **ProductCategory** | `category_id` | `parent_category_id` → `ProductCategory` | `category_name` (UK), recursive hierarchy |
| 4 | **Product** | `product_id` | `category_id` → `ProductCategory` | `sku` (UK), `barcode` (UK), `product_name`, `standard_unit_price`, `unit_of_measure`, `is_active` |
| 5 | **Employee** | `employee_id` | — | `full_name`, `role` (CHECK), `email` (UK), `phone`, `hire_date` |
| 6 | **PurchaseOrder** | `po_id` | `supplier_id` → `Supplier`, `created_by` → `Employee` | `po_number` (UK), `order_date`, `status` (CHECK), `total_amount`, `is_auto_generated` |
| 7 | **PurchaseOrderLine** | `(po_id, product_id)` | `po_id` → `PurchaseOrder`, `product_id` → `Product` | `quantity_ordered`, `unit_price` |
| 8 | **Shipment** | `shipment_id` | `po_id` → `PurchaseOrder`, `received_by` → `Employee` | `tracking_number` (UK), `carrier`, `shipment_date`, `received_date`, `status` |
| 9 | **ShipmentLine** | `(shipment_id, product_id)` | `shipment_id` → `Shipment`, `product_id` → `Product` | `quantity_shipped`, `quantity_received` |
| 10 | **InventoryLocation** | `location_id` | `parent_location_id` → `InventoryLocation` | `location_code` (UK), `location_type` (`WAREHOUSE`/`SHELF`), `capacity`, `aisle_number`, `zone` |
| 11 | **InventoryStock** | `(location_id, product_id)` | `location_id` → `InventoryLocation`, `product_id` → `Product` | `quantity_on_hand`, `reorder_threshold`, `reorder_quantity`, `last_updated_at` |
| 12 | **InventoryTransaction** | `transaction_id` | `product_id` → `Product`, `location_id` → `InventoryLocation` | `transaction_type` (`RECEIPT`/`TRANSFER_IN`/`TRANSFER_OUT`/`SALE`/`ADJUSTMENT`), `quantity`, `reference_type`, `reference_id` |
| 13 | **RestockEvent** | `restock_id` | `product_id` → `Product`, `from_location_id` → `InventoryLocation`, `to_location_id` → `InventoryLocation`, `performed_by` → `Employee` | `quantity_moved`, `event_date`, `triggered_by`, `status` |
| 14 | **ReorderTrigger** | `trigger_id` | `product_id` → `Product`, `location_id` → `InventoryLocation`, `generated_po_id` → `PurchaseOrder` | `stock_at_trigger`, `threshold_at_trigger`, `trigger_date`, `status` |
| 15 | **Customer** | `customer_id` | — | `first_name`, `last_name`, `email` (UK), `loyalty_points`, `membership_type`, `registered_date` |
| 16 | **CustomerPhone** | `(customer_id, phone_number)` | `customer_id` → `Customer` | Multi-valued phone numbers in 1NF |
| 17 | **SalesTransaction** | `transaction_id` | `customer_id` → `Customer` (NULL for guest), `cashier_id` → `Employee` | `receipt_number` (UK), `transaction_date`, `total_amount`, `status` |
| 18 | **SalesTransactionLine** | `(transaction_id, product_id)` | `transaction_id` → `SalesTransaction`, `product_id` → `Product`, `shelf_location_id` → `InventoryLocation` | `quantity_sold`, `unit_price` |
| 19 | **Payment** | `payment_id` | `transaction_id` → `SalesTransaction` | `payment_method` (`CASH`/`CREDIT_CARD`/`DEBIT_CARD`/`UPI`/`WALLET`/`POINTS`), `amount`, `reference_number`, `status` |

---

## 4. Key Business Workflows

### 4.1 Inbound Procurement & Delivery
1. Procurement officers generate a `PurchaseOrder` with line items (`PurchaseOrderLine`).
2. Suppliers fulfill goods via `Shipment` records (supporting single, multiple, or partial deliveries).
3. Inbound goods **strictly enter `WAREHOUSE`-type locations**, never shelves directly (`RECEIVE_SHIPMENT`).
4. Each received item updates warehouse stock and generates an immutable `RECEIPT` ledger row in `InventoryTransaction`.

### 4.2 Shelf Replenishment (Internal Movement)
1. Live retail shelves hold goods for POS customer pickup.
2. When shelf stock drops to or below `reorder_threshold`, `TRG_STOCK_THRESHOLD_ALERT` automatically generates a `RestockEvent` (`triggered_by = 'AUTO_THRESHOLD'`).
3. Warehouse staff restock shelves using `TRANSFER_STOCK`, decrementing warehouse stock, incrementing shelf stock, and generating matching `TRANSFER_OUT` and `TRANSFER_IN` ledger rows.

### 4.3 Point of Sale (POS) & Checkout
1. Sales strictly dispense stock from **`SHELF`-type locations** (`PROCESS_SALE`).
2. Registered shoppers have a stored `loyalty_points` balance in `Customer`, while guest shoppers are supported (`customer_id IS NULL`). (Note: An optional demonstration function `CALCULATE_LOYALTY_POINTS` is provided for academic syntax demonstration, but no specific calculation rule is prescribed by the approved DA2 handoff).
3. Tender settlement supports split payments (e.g. paying part cash/card and part UPI) through multiple `Payment` rows linked to a single `SalesTransaction`.
4. Double stock deductions are strictly prevented by clear architectural separation: `PROCESS_SALE` deducts stock procedurally, while triggers handle automated auditing and threshold event logging.

---

## 5. Oracle 11g Express Edition Compatibility

To guarantee complete compatibility with Oracle 11g XE while ensuring full forward compatibility with 12c, 19c, and 23c:
1. **Auto-Increment Primary Keys:** Implemented using standard Oracle `SEQUENCE`s and `BEFORE INSERT` triggers (`WHEN (NEW.<col> IS NULL)`). This preserves deterministic primary key values in sample data scripts while providing transparent auto-incrementing surrogate keys during PL/SQL execution.
2. **Boolean Flags:** Standardized as `VARCHAR2(5)` with `CHECK (col IN ('TRUE', 'FALSE')) DEFAULT 'TRUE'` / `DEFAULT 'FALSE'`.
3. **No Hardcoded Passwords:** The user connects to their schema interactively. No passwords are stored in any SQL file, script, log, or documentation.

---

## 6. How to Execute & Verify

### Execution Command:
In **SQL*Plus**:
```cmd
cd /d D:\PROJECTS\DBMS\sql
sqlplus system
@run_all.sql
```

In **Oracle SQL Developer**:
1. Connect as `SYSTEM` (or your project user).
2. Open `D:\PROJECTS\DBMS\sql\run_all.sql`.
3. Press **F5** (Run Script).

### University Submission Screenshot Recommendations:
Capture the following screens for your DA2 report / viva demonstration:
1. **Schema Verification:** Table list showing all 19 relations created and constraints count summary (`01_schema.sql`, `02_constraints.sql`).
2. **Catalog & Inventory Data:** Output of `SELECT * FROM Product;` and `SELECT * FROM InventoryStock;` (`03_sample_data.sql`).
3. **Multi-Table Join Output:** Receipt-level POS detail join across 5 tables (`05_joins_aggregations.sql`).
4. **Subquery & CTE Performance:** Subquery price rankings and CTE sales summary (`06_subqueries_advanced.sql`).
5. **Business Views:** Output of `SELECT * FROM vw_low_stock;` and `SELECT * FROM vw_product_stock;` (`07_views.sql`).
6. **PL/SQL Procedure Execution:** Output of `PROCESS_SALE` and `TRANSFER_STOCK` showing DBMS_OUTPUT log messages (`09_procedures.sql`).
7. **Cursor Reports:** Formatted inventory audit report from the explicit cursor (`11_cursors.sql`).
8. **Exception Handling:** Demonstration of caught `NO_DATA_FOUND` and custom overdraft exception (`12_exceptions.sql`).
9. **Automated Trigger Reaction:** Demonstration showing automatic creation of `RestockEvent` when shelf stock drops (`13_triggers.sql`).
10. **Transaction Control:** Before and after states of `COMMIT`, `ROLLBACK`, and `SAVEPOINT` (`14_transactions.sql`).
11. **Automated Test Suite:** Final screen of `15_test_cases.sql` showing `[PASS]` across all 13 integrity test scenarios.
