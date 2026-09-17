# SmartRetail DA2 — Comprehensive Implementation Audit

**Project:** SmartRetail: AI-Powered Inventory and Sales Management System  
**Target Root:** `D:\PROJECTS\DBMS`  
**Database Target:** Oracle Database 11g Express Edition Release 11.2.0.2.0 (64-bit Production)  
**Target Schema:** `SYSTEM` (Non-SYS administrative project account)  
**Primary Source of Truth:** `SmartRetail_DA2_Antigravity_Handoff.docx` & Approved DA1 EER Model (`EER_25BCE1074 (1).pdf`)  
**Audit Date:** September 2026  

---

## A. Existing Files in Workspace

The inspection of `D:\PROJECTS\DBMS` revealed the following pre-existing files:

| File Name | File Size | Description & Origin |
|---|---|---|
| `SmartRetail_DA2_Antigravity_Handoff.docx` | 45.4 KB | **Primary Implementation Brief (Source of Truth)** specifying the approved 19-relation schema, constraints, business rules, PL/SQL requirements, and Oracle conversion guidelines. |
| `ER_25BCE1074 (1).pdf` | 437.9 KB | Approved Entity-Relationship diagram representing the 19 core relations. |
| `EER_25BCE1074 (1).pdf` | 427.2 KB | Approved Enhanced ER (EER) diagram depicting generalization/specialization hierarchies (`InventoryLocation` -> `Warehouse`, `Shelf`; `Employee` -> `Cashier`, `Manager`, `Procurement Officer`, `Warehouse Staff`; `InventoryTransaction` -> `Receipt`, `Restock Transfer`, `Sale`, `Adjustment`). |
| `SmartRetail_Report.md` | 139.8 KB | Older comprehensive conceptual mini-project report draft containing an outdated 20-table schema (Category, Brand, Address, SupplierProduct, InventoryMovement, StockTransfer, etc.). |
| `SmartRetail_Presentation.md` | 19.2 KB | Older presentation slide deck referencing the outdated 20-table conceptual schema. |
| `report-style.css` | 2.1 KB | CSS styling for rendering the markdown report into HTML/PDF. |

---

## B. Existing SQL Scripts

- **Status:** **None found.**
- There were zero pre-existing `.sql` scripts in `D:\PROJECTS\DBMS`. No database objects had been created prior to this implementation.

---

## C. Existing Tables / Database State

- An environment probe on the running local Oracle instance revealed:
  - Oracle Service: `OracleServiceXE` (Running)
  - Oracle Listener: `OracleXETNSListener` (Running)
  - User Accounts: Standard system accounts (`SYSTEM`, `SYS`, `ANONYMOUS`).
  - Application Tables: None. No prior SmartRetail tables existed in the `SYSTEM` schema.

---

## D. Existing SmartRetail Schemas: Old Draft vs. Approved DA2 Model

### 1. The Older Draft Schema (`SmartRetail_Report.md` & `SmartRetail_Presentation.md`)
The older draft documented 20 entities:
`Category`, `Brand`, `Product`, `Supplier`, `SupplierProduct`, `InventoryLocation`, `Inventory`, `InventoryMovement`, `StockTransfer`, `RestockThreshold`, `Employee`, `Role`, `PurchaseOrder`, `PurchaseOrderItem`, `Shipment`, `ShipmentItem`, `Customer`, `Sale`, `SaleItem`, `Payment`, `AuditLog`.

### 2. The Approved DA2 Relational Schema (`SmartRetail_DA2_Antigravity_Handoff.docx` & EER PDF)
The approved model contains exactly **19 relations**:
1. `Supplier`
2. `SupplierPhone`
3. `ProductCategory`
4. `Product`
5. `Employee`
6. `PurchaseOrder`
7. `PurchaseOrderLine`
8. `Shipment`
9. `ShipmentLine`
10. `InventoryLocation`
11. `InventoryStock`
12. `InventoryTransaction`
13. `RestockEvent`
14. `ReorderTrigger`
15. `Customer`
16. `CustomerPhone`
17. `SalesTransaction`
18. `SalesTransactionLine`
19. `Payment`

---

## E. Conflicts Between Old Draft and Approved DOCX

The following explicit contradictions were identified between the older markdown report and the approved DOCX handoff. In accordance with the project instructions, **the DOCX version is followed exclusively**:

### CONFLICT 1: Brand Entity
- **CONFLICT:** Presence of a standalone `Brand` table.
- **DOCUMENT VERSION:** No `Brand` relation exists in the approved 19-table schema. Products belong directly to `ProductCategory`.
- **PROJECT VERSION:** `SmartRetail_Report.md` defined a standalone `Brand` entity and linked products to it.
- **RECOMMENDATION:** Follow the DOCX. Do not create a `Brand` table.

### CONFLICT 2: Supplier Address & Multi-Valued Phones
- **CONFLICT:** Modeling of Supplier address and telephone numbers.
- **DOCUMENT VERSION:** `Supplier` flattens the address attributes (`street`, `city`, `state`, `pincode`), and multi-valued phones are isolated in the separate 1NF relation `SupplierPhone (supplier_id PK/FK, phone_number PK)`.
- **PROJECT VERSION:** `SmartRetail_Report.md` modeled Address as composite sub-fields and kept a single phone field inside `Supplier`.
- **RECOMMENDATION:** Follow the DOCX. Create `Supplier` with flattened address attributes and `SupplierPhone` as the weak/multi-valued phone relation.

### CONFLICT 3: Supplier-Product Bridge Table (`SupplierProduct`)
- **CONFLICT:** Direct M:N relationship table between `Supplier` and `Product`.
- **DOCUMENT VERSION:** No `SupplierProduct` table. Supplier-product linkage is captured transactionally through `PurchaseOrder` and `PurchaseOrderLine`.
- **PROJECT VERSION:** `SmartRetail_Report.md` had a `SupplierProduct` associative entity with `supply_price` and `lead_time_days`.
- **RECOMMENDATION:** Follow the DOCX. Do not create `SupplierProduct`. Procurement is tracked via `PurchaseOrder` -> `PurchaseOrderLine` -> `Product`.

### CONFLICT 4: Category vs. ProductCategory
- **CONFLICT:** Entity naming and classification.
- **DOCUMENT VERSION:** Named `ProductCategory` with columns `category_id PK`, `category_name NN UK`, and self-referencing recursive foreign key `parent_category_id FK NULL`.
- **PROJECT VERSION:** Named `Category` in the markdown report.
- **RECOMMENDATION:** Follow the DOCX. Use the exact approved relation name `ProductCategory`.

### CONFLICT 5: Sale & SaleItem vs. SalesTransaction & SalesTransactionLine
- **CONFLICT:** POS transaction entity names.
- **DOCUMENT VERSION:** Named `SalesTransaction` (with `receipt_number UK NN`, `cashier_id FK NN`, `customer_id FK NULL`) and `SalesTransactionLine` (composite PK `transaction_id`, `product_id`, plus `shelf_location_id FK NN`).
- **PROJECT VERSION:** Named `Sale` and `SaleItem`.
- **RECOMMENDATION:** Follow the DOCX. Use `SalesTransaction` and `SalesTransactionLine`.

### CONFLICT 6: Inventory Movements vs. Unified Ledger (`InventoryTransaction`)
- **CONFLICT:** Logging of stock deltas.
- **DOCUMENT VERSION:** Single unified immutable ledger table `InventoryTransaction` with `transaction_type CHECK ('RECEIPT', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'ADJUSTMENT')` and `reference_type CHECK ('SHIPMENT', 'RESTOCK', 'SALE', 'MANUAL')`.
- **PROJECT VERSION:** Fragmented across `InventoryMovement`, `StockTransfer`, and a JSON-based `AuditLog`.
- **RECOMMENDATION:** Follow the DOCX. Implement `InventoryTransaction` as the central immutable stock ledger.

### CONFLICT 7: Restock Thresholds & Reorder Triggers
- **CONFLICT:** Threshold storage and event tracking.
- **DOCUMENT VERSION:** `InventoryStock` directly holds `reorder_threshold` and `reorder_quantity`. Threshold violations generate `RestockEvent` (for shelves) and `ReorderTrigger` (for warehouses).
- **PROJECT VERSION:** A separate table `RestockThreshold` was proposed in the old report.
- **RECOMMENDATION:** Follow the DOCX. Implement `reorder_threshold` and `reorder_quantity` inside `InventoryStock`, and implement `RestockEvent` and `ReorderTrigger` as separate operational relations.

### CONFLICT 8: Customer Multi-Valued Phones & Loyalty
- **CONFLICT:** Loyalty points storage and phones.
- **DOCUMENT VERSION:** `Customer` stores `loyalty_points` (DEFAULT 0) and `membership_type`. Multi-valued phones are stored in `CustomerPhone (customer_id PK/FK, phone_number PK)`.
- **PROJECT VERSION:** Old report proposed a separate `LoyaltyAccount` entity.
- **RECOMMENDATION:** Follow the DOCX. Store loyalty attributes directly in `Customer` and phone numbers in `CustomerPhone`.

### CONFLICT 9: Loyalty Points Calculation Formula
- **CONFLICT:** Formula for earning loyalty points.
- **DOCUMENT VERSION:** The approved DA2 handoff brief does NOT prescribe an approved loyalty points calculation formula (Section 6 explicitly notes: "Function: CALCULATE_LOYALTY_POINTS \| Implement only if the approved design defines the loyalty rule; otherwise flag as optional").
- **PROJECT VERSION:** Old report had an informal trigger formula `c.loyalty_points + FLOOR(NEW.amount / 10)` (1 pt per 10 currency units).
- **RECOMMENDATION:** Follow the DOCX. Do NOT treat `FLOOR(p_amount / 10)` as an approved SmartRetail business rule. Mark `CALCULATE_LOYALTY_POINTS` strictly as an OPTIONAL academic PL/SQL syntax demonstration.

---

## F. Missing Implementation Pieces Found & Addressed

1. **Complete SQL Scripts:** All 16 required `.sql` scripts (DDL, constraints, seed data, queries, views, indexes, PL/SQL blocks, procedures, functions, cursors, exceptions, triggers, transactions, tests) needed to be authored from scratch.
2. **Directory Structure:** Folders `docs/`, `sql/`, and `output/execution_logs/` did not exist.
3. **Documentation:** `README_DA2.md`, `TESTING.md`, and `DA2_COMMANDS_CHECKLIST.md` needed to be created.

---

## G. Oracle 11g Express Edition Compatibility Issues & Solutions

| Feature / Requirement | Issue in Oracle 11g XE | Standard Solution Adopted |
|---|---|---|
| **Auto-Increment PKs** | `GENERATED ALWAYS/BY DEFAULT AS IDENTITY` is only supported in Oracle 12c+. Running it in 11g produces `ORA-02000: missing ALWAYS keyword` or syntax error. | Use Oracle `SEQUENCE` objects combined with `BEFORE INSERT` triggers (`WHEN (NEW.<col> IS NULL)`). This allows explicit deterministic IDs during sample data loads while supporting transparent auto-increment in PL/SQL runtime. |
| **Boolean Data Types** | Oracle SQL table columns do not support native `BOOLEAN` (only PL/SQL supports boolean variables). | Use `VARCHAR2(5)` with explicit `CHECK (col IN ('TRUE', 'FALSE'))` and `DEFAULT 'TRUE'` or `DEFAULT 'FALSE'`. This strictly matches the literal `'TRUE'` / `'FALSE'` specified in the DOCX. |
| **Table Dropping Order** | Dropping parent tables first causes `ORA-02449: unique/primary keys in table referenced by foreign keys`. | In `00_reset.sql`, use `DROP TABLE ... CASCADE CONSTRAINTS PURGE` wrapped in graceful PL/SQL exception handlers (`ORA-00942` ignored). |
| **Self-Referencing Foreign Keys** | `ProductCategory` (`parent_category_id`) and `InventoryLocation` (`parent_location_id`) reference their own primary keys. | Create tables with column definitions first, and enforce self-referencing FKs via `ALTER TABLE` or inline foreign keys with `ON DELETE SET NULL`. |
| **Avoid Mutating Tables (ORA-04091)** | Row-level triggers that query or update the same table being modified cause mutating table errors in Oracle. | Stock deductions are performed procedurally in `PROCESS_SALE` and `TRANSFER_STOCK`. Triggers are used strictly for header total maintenance, stock validation, and threshold alerting on independent event tables. |
| **DBMS_OUTPUT Display** | In SQL*Plus and SQL Developer, PL/SQL `DBMS_OUTPUT` output is silent unless enabled. | Include `SET SERVEROUTPUT ON SIZE UNLIMITED;` in all PL/SQL scripts and test drivers. |

---

## H. Recommended Execution Order

The scripts must be executed in this exact order to satisfy relational dependencies:

1. `sql/00_reset.sql` — Cleanly drops all existing objects, sequences, triggers, views, and tables.
2. `sql/01_schema.sql` — Creates sequences and all 19 relations in strict parent-to-child order.
3. `sql/02_constraints.sql` — Applies named Primary Keys, Foreign Keys, Unique Keys, and Check Constraints.
4. `sql/03_sample_data.sql` — Populates rich supermarket data across all 19 tables.
5. `sql/04_basic_queries.sql` — Demonstrates DML, filtering, sorting, pattern matching, NULL checks.
6. `sql/05_joins_aggregations.sql` — Demonstrates INNER, LEFT, multi-table, SELF JOINs, and aggregates.
7. `sql/06_subqueries_advanced.sql` — Demonstrates single/multi-row, correlated subqueries, EXISTS, CASE, CTEs.
8. `sql/07_views.sql` — Creates and queries the 5 approved business views.
9. `sql/08_indexes.sql` — Creates optimized, non-redundant B-tree indexes on frequent query paths.
10. `sql/09_procedures.sql` — Compiles `PROCESS_SALE`, `RECEIVE_SHIPMENT`, `TRANSFER_STOCK`, `CREATE_PURCHASE_ORDER`.
11. `sql/10_functions.sql` — Compiles `CALCULATE_SALE_TOTAL`, `CALCULATE_STOCK_VALUE`, `CALCULATE_LOYALTY_POINTS`.
12. `sql/11_cursors.sql` — Demonstrates explicit cursor, cursor FOR loop, and parameterized cursor.
13. `sql/12_exceptions.sql` — Demonstrates `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `DUP_VAL_ON_INDEX`, `OTHERS`, and user-defined exceptions.
14. `sql/13_triggers.sql` — Compiles PO total, Sale total, Shelf restock, and Warehouse reorder triggers.
15. `sql/14_transactions.sql` — Demonstrates `COMMIT`, `ROLLBACK`, `SAVEPOINT`, and `ROLLBACK TO SAVEPOINT`.
16. `sql/15_test_cases.sql` — Comprehensive 13-part test suite validating constraints, procedures, and triggers.
17. `sql/run_all.sql` — Master runner executing the entire sequence with spooling to `output/execution_logs/run_all.log`.
