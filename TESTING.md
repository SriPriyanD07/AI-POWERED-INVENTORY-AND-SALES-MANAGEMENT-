# SmartRetail DA2 — Testing & Verification Guide

This document details the test suite, execution methodology, expected outcomes, and step-by-step instructions for running and verifying the **SmartRetail (DA2)** database implementation in Oracle SQL Developer or SQL*Plus.

---

## 1. Prerequisites & Execution Environment

- **Database Engine:** Oracle Database 11g Express Edition / 12c / 19c / 21c / 23c
- **Target Schema:** `SYSTEM` (or dedicated project user account)
- **Tooling:** Oracle SQL Developer or SQL*Plus CLI
- **Source Scripts:** `D:\PROJECTS\DBMS\sql\`
- **Execution Log:** `D:\PROJECTS\DBMS\output\execution_logs\run_all.log`
- **Business Function Scope:** `CALCULATE_SALE_TOTAL` and `CALCULATE_STOCK_VALUE` are the canonical approved functions. `CALCULATE_LOYALTY_POINTS` is provided strictly as an optional academic PL/SQL syntax demonstration and is not an approved business rule.

---

## 2. How to Run the Implementation

### Option A: Using SQL*Plus (Command Line)
1. Open Windows PowerShell or Command Prompt.
2. Navigate to the SQL directory:
   ```cmd
   cd /d D:\PROJECTS\DBMS\sql
   ```
3. Launch SQL*Plus and connect to your schema:
   ```cmd
   sqlplus system
   ```
   *(You will be prompted to enter your password interactively. It is never hard-coded.)*
4. Run the master driver script:
   ```sql
   @run_all.sql
   ```
5. Review the execution output directly on screen or inspect the generated log at:
   `D:\PROJECTS\DBMS\output\execution_logs\run_all.log`

### Option B: Using Oracle SQL Developer (GUI)
1. Open **Oracle SQL Developer**.
2. Connect to your database connection (e.g. `SYSTEM` or your project user).
3. Verify your connected identity by executing:
   ```sql
   SELECT USER FROM DUAL;
   ```
4. Open the file `D:\PROJECTS\DBMS\sql\run_all.sql` in a SQL Worksheet.
5. Click the **Run Script (F5)** button.
6. Check the **Script Output** pane to confirm all objects, tables, constraints, queries, and test cases execute cleanly.

---

## 3. The 13-Part Integrity Test Suite (`15_test_cases.sql`)

The test suite in `sql/15_test_cases.sql` automatically runs the following 13 automated tests:

| Test # | Test Scenario | Mechanism & Target | Expected Result | Pass Criteria |
|---|---|---|---|---|
| **TEST 1** | **Valid Product Insert** | Inserts a compliant record into `Product` referencing Category 5 | Record inserted cleanly, verified by count | Count = 1, cleaned up with DELETE |
| **TEST 2** | **Foreign Key Violation** | Inserts into `Product` with non-existent `category_id = 99999` | Oracle error `ORA-02291` raised | Caught by exception handler, reports `[PASS]` |
| **TEST 3** | **Unique Key Violation** | Inserts customer with existing email (`aditya.verma@gmail.com`) | Oracle error `ORA-00001` raised | Caught by exception handler, reports `[PASS]` |
| **TEST 4** | **Check Constraint Violation** | Inserts `PurchaseOrderLine` with negative quantity (`-25`) | Oracle error `ORA-02290` raised | Caught by exception handler, reports `[PASS]` |
| **TEST 5** | **Sale Decrements Shelf Stock** | Executes `PROCESS_SALE` for 2 units of Bread from Shelf 4 | Live shelf stock decremented by 2 | QOH_after = QOH_before - 2 |
| **TEST 6** | **Shipment Increments Warehouse Stock** | Executes `RECEIVE_SHIPMENT` for 20 units of Rice at Warehouse 1 | Warehouse stock increased by 20 | QOH_after = QOH_before + 20 |
| **TEST 7** | **Stock Movement Creates Ledger** | Queries `InventoryTransaction` for audit rows (`SALE`, `RECEIPT`) | Ledger table contains non-zero records | Count > 0 verified |
| **TEST 8** | **Low Shelf Stock Triggers RestockEvent** | Updates shelf stock below threshold (`QOH = 5 <= 8`) | Trigger `TRG_STOCK_THRESHOLD_ALERT` creates `RestockEvent` | Event created with status `PENDING` |
| **TEST 9** | **Low Warehouse Stock Triggers ReorderTrigger** | Updates warehouse stock below threshold (`QOH = 10 <= 20`) | Trigger `TRG_STOCK_THRESHOLD_ALERT` creates `ReorderTrigger` | Trigger created with status `OPEN` |
| **TEST 10** | **Split Payment Settlement** | Inserts sale of 500.00 with 300 Card + 200 UPI payments | Both tender rows persisted | `SUM(amount)` equals sale total (500.00) |
| **TEST 11** | **Procedure Success Execution** | Calls `CREATE_PURCHASE_ORDER` with auto-flag | Generates PO, line, and computed total | PO Total = 5200.00 verified |
| **TEST 12** | **Procedure Overdraft Failure** | Calls `PROCESS_SALE` for 9999 units (exceeds stock) | Custom error `-20012` raised | Caught by exception handler, reports `[PASS]` |
| **TEST 13** | **Rollback Restores State** | Inserts test customer then executes `ROLLBACK` | Database state completely restored | Record count unchanged before & after |

---

## 4. Post-Execution Record Count Verification

Upon successful execution of `run_all.sql`, running the following query will confirm that all 19 tables are populated:

```sql
SELECT 'Supplier' AS relation_name, COUNT(*) AS total_records FROM Supplier UNION ALL
SELECT 'SupplierPhone', COUNT(*) FROM SupplierPhone UNION ALL
SELECT 'ProductCategory', COUNT(*) FROM ProductCategory UNION ALL
SELECT 'Product', COUNT(*) FROM Product UNION ALL
SELECT 'Employee', COUNT(*) FROM Employee UNION ALL
SELECT 'PurchaseOrder', COUNT(*) FROM PurchaseOrder UNION ALL
SELECT 'PurchaseOrderLine', COUNT(*) FROM PurchaseOrderLine UNION ALL
SELECT 'Shipment', COUNT(*) FROM Shipment UNION ALL
SELECT 'ShipmentLine', COUNT(*) FROM ShipmentLine UNION ALL
SELECT 'InventoryLocation', COUNT(*) FROM InventoryLocation UNION ALL
SELECT 'InventoryStock', COUNT(*) FROM InventoryStock UNION ALL
SELECT 'InventoryTransaction', COUNT(*) FROM InventoryTransaction UNION ALL
SELECT 'RestockEvent', COUNT(*) FROM RestockEvent UNION ALL
SELECT 'ReorderTrigger', COUNT(*) FROM ReorderTrigger UNION ALL
SELECT 'Customer', COUNT(*) FROM Customer UNION ALL
SELECT 'CustomerPhone', COUNT(*) FROM CustomerPhone UNION ALL
SELECT 'SalesTransaction', COUNT(*) FROM SalesTransaction UNION ALL
SELECT 'SalesTransactionLine', COUNT(*) FROM SalesTransactionLine UNION ALL
SELECT 'Payment', COUNT(*) FROM Payment;
```

---

## 5. Troubleshooting & Error Catalog

| Error Code | Root Cause | Built-in Mitigation |
|---|---|---|
| `ORA-00942: table or view does not exist` | Attempting to drop an object that does not exist yet | Handled gracefully in `00_reset.sql` via dynamic PL/SQL exception traps. |
| `ORA-02449: unique/primary keys in table referenced by foreign keys` | Dropping parent tables before child tables | Resolved by using `CASCADE CONSTRAINTS PURGE` in `00_reset.sql`. |
| `ORA-02000: missing ALWAYS keyword` | Using Oracle 12c+ `IDENTITY` syntax on Oracle 11g | Resolved by using Oracle `SEQUENCE`s and `BEFORE INSERT` triggers. |
| `ORA-04091: table is mutating` | Row-level triggers attempting to query/modify their own triggering table | Resolved by handling business updates in procedures (`PROCESS_SALE`, `TRANSFER_STOCK`) and keeping triggers decoupled. |

---

## 6. Live Execution Verification Summary

**Execution Status:** **100% VERIFIED ON ORACLE 11g EXPRESS EDITION (11.2.0.2.0)**  
**Connected User Verified:** `SYSTEM`  
**Execution Timestamp:** September 17, 2026  
**Execution Log Location:** `D:\PROJECTS\DBMS\output\execution_logs\run_all.log`  

### Automated Test Results (13/13 Passed):
```
[PASS] TEST 1: Valid Product inserted and verified.
[PASS] TEST 2: Foreign Key constraint correctly rejected invalid category (ORA-02291).
[PASS] TEST 3: Unique key constraint correctly blocked duplicate email (ORA-00001).
[PASS] TEST 4: Check constraint correctly rejected negative quantity (ORA-02290).
[PASS] TEST 5: Shelf stock correctly reduced from 25 to 23.
[PASS] TEST 6: Warehouse stock increased from 50 to 70.
[PASS] TEST 7: Verified 13 immutable stock ledger records in InventoryTransaction.
[PASS] TEST 8: Automated RestockEvent successfully generated for Shelf 5.
[PASS] TEST 9: ReorderTrigger successfully generated for Warehouse 1.
[PASS] TEST 10: Split payment verified! Total=500 (Card=300, UPI=200).
[PASS] TEST 11: CREATE_PURCHASE_ORDER executed cleanly. PO_ID=6, Total=5200.
[PASS] TEST 12: PROCESS_SALE correctly raised and trapped insufficient stock error (-20012).
[PASS] TEST 13: ROLLBACK successfully revoked uncommitted data. Count preserved at 5.
```

### Verified Final Record Counts (All 19 Relations Non-Empty):
| Relation Name | Total Records | Integrity Status |
|---|---|---|
| **Supplier** | 5 | Master vendor records verified |
| **SupplierPhone** | 7 | 1NF Multi-valued phones verified |
| **ProductCategory** | 11 | Hierarchical parent-child categories verified |
| **Product** | 15 | Active product catalog verified |
| **Employee** | 6 | Staff across all roles verified |
| **PurchaseOrder** | 6 | Procurement orders & totals verified |
| **PurchaseOrderLine** | 14 | Line items & prices verified |
| **Shipment** | 4 | Inbound shipments & statuses verified |
| **ShipmentLine** | 10 | Quantities shipped/received verified |
| **InventoryLocation** | 6 | Warehouses & Shelves verified |
| **InventoryStock** | 20 | Live QOH across locations verified |
| **InventoryTransaction** | 13 | Immutable stock audit ledger rows verified |
| **RestockEvent** | 6 | Internal shelf movements verified |
| **ReorderTrigger** | 3 | Low warehouse stock alerts verified |
| **Customer** | 5 | Registered customers with points verified |
| **CustomerPhone** | 6 | 1NF Multi-valued phones verified |
| **SalesTransaction** | 8 | POS sales transactions verified |
| **SalesTransactionLine** | 13 | POS line items & subtotals verified |
| **Payment** | 8 | Tender records & split payments verified |

