# SmartRetail — AI-Powered Inventory and Sales Management System

## Overview

**SmartRetail** is an enterprise-grade, normalized relational database management system designed to support modern supermarket retail operations. The system manages the entire retail lifecycle—from supplier procurement and warehouse receiving to point-of-sale (POS) checkout, split-tender payments, and multi-tier inventory synchronization between warehouse storage and retail display shelves.

Built on strict relational modeling principles and adhering to Boyce-Codd Normal Form (BCNF), the system maintains an immutable audit ledger of all inventory movements and provides reactive trigger-driven event mechanisms for automated stock replenishment.

---

## Features

- **Multi-Tier Inventory Architecture:** Clear physical segregation between bulk `WAREHOUSE` storage and front-of-store `SHELF` display locations.
- **Immutable Transaction Ledger:** Every stock addition, deduction, or transfer is auditable via `InventoryTransaction` records.
- **Automated Replenishment Triggers:**
  - When shelf stock drops to or below threshold, automated `RestockEvent` records are logged for internal warehouse-to-shelf transfer.
  - When warehouse stock breaches safety threshold, automated `ReorderTrigger` records are generated for supplier procurement.
- **Procurement & Receiving Lifecycle:** Tracks purchase orders, itemized lines, inbound supplier shipments, and partial delivery reconciliation.
- **Flexible POS Checkout:** Supports customer checkout with optional guest checkout (`customer_id IS NULL`), cashier attribution, and split-tender payment settlement across Cash, Credit Card, Debit Card, UPI, and Wallet.
- **Transactional Integrity:** Automated total calculation triggers, stock overdraft exception handling, and savepoint rollback recovery.

---

## Database Schema

The database strictly implements the **19 approved relations** specified in the approved DA1 relational architecture (`SmartRetail_DA2_Antigravity_Handoff.docx`), verified via a comprehensive schema conformance audit:

1. **`Supplier`**: Master commercial vendor registry with GST identification, contact attributes, postal address, and vendor performance ratings (CHECK 1–5).
2. **`SupplierPhone`**: Multivalued vendor telephone numbers adhering to 1NF composite primary key `(supplier_id, phone_number)`.
3. **`ProductCategory`**: Hierarchical merchandise category taxonomy supporting recursive self-referencing subcategories (`parent_category_id`).
4. **`Product`**: Merchandise catalog tracking SKU, barcode, unit of measure, category classification, and retail standard unit pricing.
5. **`Employee`**: Store personnel directory with role-based segregation (`MANAGER`, `CASHIER`, `INVENTORY_CLERK`, `ADMIN`).
6. **`PurchaseOrder`**: Procurement order headers with supplier references, order status tracking, and auto-generation flags.
7. **`PurchaseOrderLine`**: Itemized procurement order lines with contracted procurement costs and quantities.
8. **`Shipment`**: Inbound freight and logistics tracking carrier information, tracking numbers, and delivery dates.
9. **`ShipmentLine`**: Receiving reconciliation lines comparing shipped quantities against physical quantities received.
10. **`InventoryLocation`**: Hierarchical facility storage mapping distinguishing `WAREHOUSE` locations from retail `SHELF` locations.
11. **`InventoryStock`**: Real-time stock balance ledger per location with automated replenishment thresholds and quantities.
12. **`InventoryTransaction`**: Immutable audit ledger recording every physical movement (`RECEIPT`, `TRANSFER_IN`, `TRANSFER_OUT`, `SALE`, `ADJUSTMENT`).
13. **`RestockEvent`**: Internal warehouse-to-shelf replenishment tracking for depleted retail shelves (`PENDING`, `COMPLETED`).
14. **`ReorderTrigger`**: Procurement reorder triggers logged automatically when warehouse safety stock is breached (`OPEN`, `PO_CREATED`, `RESOLVED`, `IGNORED`).
15. **`Customer`**: Retail customer registry tracking loyalty point balances and tier profiles (`REGULAR`, `SILVER`, `GOLD`, `PLATINUM`).
16. **`CustomerPhone`**: Multivalued customer telephone contact numbers with composite primary key `(customer_id, phone_number)`.
17. **`SalesTransaction`**: Point-of-sale receipt headers linked to cashier employee and optional customer profile.
18. **`SalesTransactionLine`**: Itemized checkout lines recording unit prices, quantities sold, and dispensing shelf locations.
19. **`Payment`**: Multi-tender split settlement supporting Cash, Credit Card, Debit Card, UPI, Wallet, and Points.

---

## SQL & PL/SQL Implementation

The project includes a comprehensive, modular suite of SQL and PL/SQL program units:

- **DDL & Schema Definition (`01_schema.sql`):** Oracle sequences, 19 tables, and transparent surrogate key assignment triggers.
- **Integrity Constraints (`02_constraints.sql`):** Primary keys, foreign keys with referential actions, unique constraints on business identifiers, and check constraints enforcing domain integrity.
- **DML & Seed Data (`03_sample_data.sql`):** Realistic supermarket test data across all 19 relations with deterministic sequence synchronization.
- **Basic Queries (`04_basic_queries.sql`):** Core projection, filtering, ordering, pattern matching, NULL-safe operations, and data modification operations.
- **Joins & Aggregations (`05_joins_aggregations.sql`):** Multi-table receipt reconstruction joins (5-table join), self-joins on hierarchical categories, `GROUP BY`, and `HAVING` filters.
- **Advanced SQL (`06_subqueries_advanced.sql`):** Correlated subqueries, `EXISTS` operators, conditional `CASE` logic, Common Table Expressions (CTEs), and analytic window functions (`RANK()`, `DENSE_RANK()`).
- **Database Views (`07_views.sql`):** 5 business views including low-stock alerts (`vw_low_stock`) and aggregated product stock valuation (`vw_product_stock`).
- **Performance Indexes (`08_indexes.sql`):** B-Tree indexes on foreign keys, transaction timestamps, and search attributes.
- **Stored Procedures (`09_procedures.sql`):**
  - `PROCESS_SALE`: Atomically validates stock, decrements shelf inventory, records audit ledger, and creates sales receipt lines.
  - `RECEIVE_SHIPMENT`: Reconciles inbound goods, increments warehouse inventory, and records receipt audit movements.
  - `TRANSFER_STOCK`: Transfers stock from warehouse to retail shelves with dual audit entries (`TRANSFER_OUT` and `TRANSFER_IN`).
  - `CREATE_PURCHASE_ORDER`: Programmatically generates procurement purchase orders.
- **Stored Functions (`10_functions.sql`):**
  - `CALCULATE_SALE_TOTAL`: Computes total sales amount for a transaction.
  - `CALCULATE_STOCK_VALUE`: Computes total monetary value of current inventory holdings.
  - `CALCULATE_LOYALTY_POINTS`: Marked explicitly as `[OPTIONAL / DEMONSTRATION ONLY]` for academic syntax demonstration.
- **Cursors (`11_cursors.sql`):** Demonstrations of Explicit Cursors (`OPEN`, `FETCH`, `%NOTFOUND`, `CLOSE`), Cursor `FOR` Loops, and Parameterized Cursors.
- **Exception Handling (`12_exceptions.sql`):** Handlers for predefined Oracle exceptions (`NO_DATA_FOUND`, `TOO_MANY_ROWS`, `DUP_VAL_ON_INDEX`), `OTHERS`, and user-defined business exceptions (e.g., error `-20012` for insufficient stock).
- **Triggers (`13_triggers.sql`):**
  - `TRG_PO_LINE_TOTAL_SYNC`: Synchronizes purchase order header totals on line insertions/deletions.
  - `TRG_SALE_LINE_TOTAL_SYNC`: Synchronizes sales receipt header totals on line items.
  - `TRG_STOCK_THRESHOLD_ALERT`: Evaluates stock changes, logging `RestockEvent` for shelves and `ReorderTrigger` for warehouses.
- **Transaction Control (`14_transactions.sql`):** Demonstrates `COMMIT`, `ROLLBACK`, and `SAVEPOINT` ensuring ACID atomicity.

---

## Business Workflow

The system models the complete physical and transactional flow of retail goods:

```
[ Supplier ]
     │
     ▼ (PurchaseOrder & PurchaseOrderLine)
[ Inbound Shipment ]
     │
     ▼ (Physical Receiving & Reconciliation)
[ Warehouse Storage (Bulk) ]
     │
     ▼ (Automated RestockEvent / TRANSFER_STOCK)
[ Shelf Display (Front-of-Store) ]
     │
     ▼ (POS Checkout: PROCESS_SALE)
[ SalesTransaction & SalesTransactionLine ]
     │
     ▼ (Multi-Tender Settlement)
[ Payment (Cash / Card / UPI) ]
```

- **Automated Replenishment:**
  - Shelf depleted below threshold → `RestockEvent` created → Stock moved from Warehouse to Shelf.
  - Warehouse depleted below threshold → `ReorderTrigger` created → Purchase Order generated for Supplier.

---

## Testing

The implementation includes a 13-scenario automated regression test suite (`sql/15_test_cases.sql`).

**Verified Result: 13 / 13 TESTS PASSED (0 Failures)**

| Test # | Test Scenario | Verified Outcome | Status |
|:---:|:---|:---|:---:|
| **1** | Valid Product Insert | Product inserted into Category 5 cleanly | **PASS** |
| **2** | Foreign Key Violation | Invalid `category_id` (99999) rejected (`ORA-02291`) | **PASS** |
| **3** | Unique Key Violation | Duplicate customer email rejected (`ORA-00001`) | **PASS** |
| **4** | Check Constraint Violation | Negative order quantity (-25) rejected (`ORA-02290`) | **PASS** |
| **5** | Sale Decrements Shelf Stock | `PROCESS_SALE` successfully reduced shelf quantity | **PASS** |
| **6** | Inbound Shipment Increments Stock | `RECEIVE_SHIPMENT` incremented warehouse quantity | **PASS** |
| **7** | Immutable Stock Ledger Creation | Verified immutable records in `InventoryTransaction` | **PASS** |
| **8** | Low Shelf Stock Alerts RestockEvent | Automated `RestockEvent` logged (`Status: PENDING`) | **PASS** |
| **9** | Low Warehouse Stock Alerts ReorderTrigger | Automated `ReorderTrigger` logged (`Status: OPEN`) | **PASS** |
| **10** | Split Payment Settlement | Multiple tender rows persisted, sum equals invoice | **PASS** |
| **11** | Stored Procedure Execution | `CREATE_PURCHASE_ORDER` executed with valid PO generated | **PASS** |
| **12** | Overdraft Failure & Exception | `PROCESS_SALE` trapped insufficient stock error (`-20012`) | **PASS** |
| **13** | Transaction Control & Rollback | Uncommitted insert revoked cleanly, count preserved | **PASS** |

---

## Project Structure

```
D:\PROJECTS\DBMS
│
├── .gitignore                                     # Repository ignore rules
├── README.md                                      # Repository landing documentation (this file)
├── README_DA2.md                                  # Detailed university DA2 project guide
├── DA2_COMMANDS_CHECKLIST.md                      # Command-by-command compliance checklist
├── TESTING.md                                     # Testing methodology & verification details
├── SCHEMA_CONFORMANCE_AUDIT.md                    # 19/19 formal schema conformance audit
├── IMPLEMENTATION_AUDIT.md                        # Pre-implementation workspace audit
├── SmartRetail_Report.md                          # Full system design and architecture report
├── SmartRetail_Presentation.md                    # Project presentation slides
├── SmartRetail_DA2_Antigravity_Handoff.docx       # Primary project brief & requirements
├── ER_25BCE1074 (1).pdf                           # Approved Entity-Relationship diagram
├── EER_25BCE1074 (1).pdf                          # Approved Enhanced Entity-Relationship diagram
├── report-style.css                               # Markdown report stylesheet
│
├── docs/                                          # Reference documentation & schema dumps
│   ├── SmartRetail_DA2_Antigravity_Handoff.docx
│   ├── db_actual_schema.txt
│   ├── db_actual_desc_and_constraints.txt
│   ├── db_constraints_clean.txt
│   ├── docx_full_text.txt
│   └── schema_comparison_output.txt
│
├── sql/                                           # Core SQL & PL/SQL implementation
│   ├── 00_reset.sql                               # Drop all objects & sequences
│   ├── 01_schema.sql                              # Sequences, 19 tables, ID triggers
│   ├── 02_constraints.sql                         # PKs, FKs, UKs, Check constraints
│   ├── 03_sample_data.sql                         # Seed data for all 19 relations
│   ├── 04_basic_queries.sql                       # DML and basic SELECT queries
│   ├── 05_joins_aggregations.sql                  # Multi-table joins & aggregations
│   ├── 06_subqueries_advanced.sql                 # CTEs, subqueries, analytic window functions
│   ├── 07_views.sql                               # 5 Approved business views
│   ├── 08_indexes.sql                             # Performance B-Tree indexes
│   ├── 09_procedures.sql                          # Stored procedures
│   ├── 10_functions.sql                           # Stored functions
│   ├── 11_cursors.sql                             # Explicit, FOR loop, & parameterized cursors
│   ├── 12_exceptions.sql                          # Predefined & user-defined exceptions
│   ├── 13_triggers.sql                            # Audit & threshold event triggers
│   ├── 14_transactions.sql                        # COMMIT, ROLLBACK, SAVEPOINT
│   ├── 15_test_cases.sql                          # 13-part automated test suite
│   ├── run_all.sql                                # Master batch execution script
│   └── evidence_scripts/                          # 15 Calibrated single-topic execution scripts
│       ├── 01_schema_tables.sql ... 15_final_tests.sql
│       └── run_all_evidence.sql
│
└── output/                                        # Evidence, logs, and final reports
    ├── DA2_Evidence_Report.docx                   # Formatted DOCX evidence report
    ├── DA2_Evidence_Report.pdf                    # PDF version of evidence report
    ├── execution_logs/                            # Spooled test execution logs
    │   └── run_all.log
    ├── SCREENSHOTS/                               # 15 High-resolution console PNG screenshots
    │   ├── 01_schema_tables.png ... 15_final_tests.png
    └── DA2_EVIDENCE/                              # Standalone evidence package
        ├── DA2_Evidence_Report.docx
        ├── evidence_index.md
        ├── update_evidence_docx.py
        ├── execution_outputs/ (01–15 .txt outputs)
        └── screenshots/ (01–15 .png screenshots)
```

---

## DA2 Evidence

Complete implementation evidence is packaged and verified in the repository:

- **Formal Evidence Document:** [`output/DA2_Evidence_Report.docx`](output/DA2_Evidence_Report.docx) and [`output/DA2_Evidence_Report.pdf`](output/DA2_Evidence_Report.pdf) contain the complete implementation evidence, featuring embedded SQL*Plus console execution screenshots for every section.
- **Genuine Terminal Screenshots:** [`output/SCREENSHOTS/`](output/SCREENSHOTS/) contains all 15 high-resolution console execution screenshots formatted with standard line widths and clean column headers.
- **Raw Execution Outputs:** [`output/DA2_EVIDENCE/execution_outputs/`](output/DA2_EVIDENCE/execution_outputs/) contains verbatim text outputs generated during direct execution against Oracle 11g.
- **Conformance Audits:** [`SCHEMA_CONFORMANCE_AUDIT.md`](SCHEMA_CONFORMANCE_AUDIT.md) provides an attribute-by-attribute audit confirming 100% parity across all 19 relations.

---

## Database

- **Target Engine:** Oracle Database 11g Express Edition Release 11.2.0.2.0 (64-bit)
- **Compatibility:** Fully tested on Oracle 11g XE; forward-compatible with Oracle 12c, 19c, 21c, and 23c.
- **Execution Schema:** `SYSTEM` (or an explicitly designated project schema user).

---

## How to Run

### Safe Execution via SQL*Plus

1. Open a terminal or command prompt and navigate to the `sql/` directory:
   ```cmd
   cd /d D:\PROJECTS\DBMS\sql
   ```

2. Connect to your local Oracle Database schema interactively:
   ```cmd
   sqlplus system
   ```
   *(Enter your password interactively when prompted. Passwords should never be passed on the command line or stored in scripts).*

3. Execute the master driver script:
   ```sql
   @run_all.sql
   ```
   This script sequentially runs:
   - Object cleanup (`00_reset.sql`)
   - Schema and table creation (`01_schema.sql`)
   - Constraint application (`02_constraints.sql`)
   - Sample data population (`03_sample_data.sql`)
   - Queries, views, and indexes (`04`–`08`)
   - PL/SQL procedures, functions, cursors, and triggers (`09`–`14`)
   - Complete automated test suite (`15_test_cases.sql`)
   - Spools execution log to `output/execution_logs/run_all.log`.

### Execution via Oracle SQL Developer

1. Launch Oracle SQL Developer and connect to your project connection.
2. Open `sql/run_all.sql`.
3. Press **F5** (Run Script) to execute the complete build and verification suite.
