# SmartRetail DA2 — Evidence Index & Screenshot Catalog

**Deliverable:** Digital Assignment 2 (DA2) Implementation Evidence  
**RDBMS:** Oracle Database 11g Express Edition Release 11.2.0.2.0 (64-bit Production)  
**Schema:** `SYSTEM`  
**Report Document:** `output/DA2_Evidence_Report.docx`  

This document indexes all 15 required DA2 evidence artifacts, linking each screenshot to its report section, SQL script, execution output, and verification status.

---

## Screenshot & Artifact Catalog

| # | Screenshot Filename | Report Section | SQL Script | Live Execution Output | Status | Description |
|:---:|---|---|---|---|:---:|---|
| **01** | `01_schema_tables.png` | 2. Database Schema | [`01_schema_tables.sql`](../../sql/evidence_scripts/01_schema_tables.sql) | [`01_schema_tables.txt`](execution_outputs/01_schema_tables.txt) | **Captured & Embedded** | 19 Approved Relations Verification |
| **02** | `02_product_data.png` | 3. Data Population | [`02_product_data.sql`](../../sql/evidence_scripts/02_product_data.sql) | [`02_product_data.txt`](execution_outputs/02_product_data.txt) | **Captured & Embedded** | Product Catalog Data (Zero Line Wraps) |
| **03** | `03_inventory_data.png` | 3. Data Population | [`03_inventory_data.sql`](../../sql/evidence_scripts/03_inventory_data.sql) | [`03_inventory_data.txt`](execution_outputs/03_inventory_data.txt) | **Captured & Embedded** | Multi-Location Inventory Balances |
| **04** | `04_multi_table_join.png` | 4.1 Multi-Table JOIN | [`04_multi_table_join.sql`](../../sql/evidence_scripts/04_multi_table_join.sql) | [`04_multi_table_join.txt`](execution_outputs/04_multi_table_join.txt) | **Captured & Embedded** | 5-Table POS Receipt Query (Zero Line Wraps) |
| **05** | `05_aggregation.png` | 4.2 Aggregation | [`05_aggregation.sql`](../../sql/evidence_scripts/05_aggregation.sql) | [`05_aggregation.txt`](execution_outputs/05_aggregation.txt) | **Captured & Embedded** | Aggregations with GROUP BY & HAVING |
| **06** | `06_advanced_sql.png` | 4.3 Advanced SQL | [`06_advanced_sql.sql`](../../sql/evidence_scripts/06_advanced_sql.sql) | [`06_advanced_sql.txt`](execution_outputs/06_advanced_sql.txt) | **Captured & Embedded** | Analytic Window Functions (Complete Product Names) |
| **07** | `07_views.png` | 5. Views | [`07_views.sql`](../../sql/evidence_scripts/07_views.sql) | [`07_views.txt`](execution_outputs/07_views.txt) | **Captured & Embedded** | Approved SmartRetail Views (VW_LOW_STOCK) |
| **08** | `08_procedures.png` | 6. PL/SQL Procedures | [`08_procedures.sql`](../../sql/evidence_scripts/08_procedures.sql) | [`08_procedures.txt`](execution_outputs/08_procedures.txt) | **Captured & Embedded** | All 4 Stored Procedures Executed with [PASS] |
| **09** | `09_functions.png` | 7. PL/SQL Functions | [`09_functions.sql`](../../sql/evidence_scripts/09_functions.sql) | [`09_functions.txt`](execution_outputs/09_functions.txt) | **Captured & Embedded** | Approved Stored Functions + Demo Loyalty Callout |
| **10** | `10_cursors.png` | 8. Cursors | [`10_cursors.sql`](../../sql/evidence_scripts/10_cursors.sql) | [`10_cursors.txt`](execution_outputs/10_cursors.txt) | **Captured & Embedded** | Explicit, Loop & Parameterized Cursors |
| **11** | `11_exceptions.png` | 9. Exception Handling | [`11_exceptions.sql`](../../sql/evidence_scripts/11_exceptions.sql) | [`11_exceptions.txt`](execution_outputs/11_exceptions.txt) | **Captured & Embedded** | Predefined & Custom User Exceptions (-20012) |
| **12** | `12_triggers.png` | 10. Triggers | [`12_triggers.sql`](../../sql/evidence_scripts/12_triggers.sql) | [`12_triggers.txt`](execution_outputs/12_triggers.txt) | **Captured & Embedded** | Reactive Alert Triggers (Restock & Reorder) |
| **13** | `13_transactions.png` | 11. Transaction Management | [`13_transactions.sql`](../../sql/evidence_scripts/13_transactions.sql) | [`13_transactions.txt`](execution_outputs/13_transactions.txt) | **Captured & Embedded** | Transaction Control & Savepoint Rollback |
| **14** | `14_constraints.png` | 12. Constraint Enforcement | [`14_constraints.sql`](../../sql/evidence_scripts/14_constraints.sql) | [`14_constraints.txt`](execution_outputs/14_constraints.txt) | **Captured & Embedded** | Active Constraints Data Dictionary Summary |
| **15** | `15_final_tests.png` | 13. Automated Test Suite | [`15_final_tests.sql`](../../sql/evidence_scripts/15_final_tests.sql) | [`15_final_tests.txt`](execution_outputs/15_final_tests.txt) | **Captured & Embedded** | 13/13 Automated Tests Execution (0 Failures) |


---

## Instructions for Capturing Remaining Screenshots

1. Open **SQL*Plus** or **Command Prompt**:
   ```cmd
   cd /d D:\PROJECTS\DBMS\sql\evidence_scripts
   sqlplus system
   ```
2. Run the interactive evidence runner:
   ```sql
   @run_all_evidence.sql
   ```
3. Press **[ENTER]** to run each script.
4. When each query displays, capture the window using `Alt + PrintScreen` or `Win + Shift + S`.
5. Save each screenshot as PNG into:
   `D:\PROJECTS\DBMS\output\DA2_EVIDENCE\screenshots\`
6. Once saved, run:
   ```cmd
   python D:\PROJECTS\DBMS\output\DA2_EVIDENCE\update_evidence_docx.py
   ```
   This automatically embeds all captured screenshots into `DA2_Evidence_Report.docx`!
