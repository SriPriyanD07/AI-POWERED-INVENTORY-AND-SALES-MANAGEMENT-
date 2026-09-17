-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: run_all.sql
-- DESCRIPTION: Master driver script executing the entire SmartRetail DA2 project
--              in strict dependency order with spooling to execution_logs.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;
SET ECHO ON;
SET FEEDBACK ON;
SET PAGESIZE 50;
SET LINESIZE 140;

-- Spool all output to execution_logs directory
SPOOL D:\PROJECTS\DBMS\output\execution_logs\run_all.log

PROMPT =========================================================================;
PROMPT SMARTRETAIL — AI-POWERED INVENTORY AND SALES MANAGEMENT SYSTEM
PROMPT UNIVERSITY DBMS MINI-PROJECT (DA2) — COMPLETE IMPLEMENTATION SUITE
PROMPT =========================================================================;

PROMPT Verifying Connected Schema User:
SELECT USER AS connected_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS run_time FROM dual;

PROMPT Step 0: Executing 00_reset.sql...
@@00_reset.sql

PROMPT Step 1: Executing 01_schema.sql...
@@01_schema.sql

PROMPT Step 2: Executing 02_constraints.sql...
@@02_constraints.sql

PROMPT Step 3: Executing 03_sample_data.sql...
@@03_sample_data.sql

PROMPT Step 4: Executing 04_basic_queries.sql...
@@04_basic_queries.sql

PROMPT Step 5: Executing 05_joins_aggregations.sql...
@@05_joins_aggregations.sql

PROMPT Step 6: Executing 06_subqueries_advanced.sql...
@@06_subqueries_advanced.sql

PROMPT Step 7: Executing 07_views.sql...
@@07_views.sql

PROMPT Step 8: Executing 08_indexes.sql...
@@08_indexes.sql

PROMPT Step 9: Executing 09_procedures.sql...
@@09_procedures.sql

PROMPT Step 10: Executing 10_functions.sql...
@@10_functions.sql

PROMPT Step 11: Executing 11_cursors.sql...
@@11_cursors.sql

PROMPT Step 12: Executing 12_exceptions.sql...
@@12_exceptions.sql

PROMPT Step 13: Executing 13_triggers.sql...
@@13_triggers.sql

PROMPT Step 14: Executing 14_transactions.sql...
@@14_transactions.sql

PROMPT Step 15: Executing 15_test_cases.sql...
@@15_test_cases.sql

PROMPT =========================================================================;
PROMPT FINAL VERIFICATION: RECORD COUNTS FOR ALL 19 APPROVED RELATIONS
PROMPT =========================================================================;

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

PROMPT =========================================================================;
PROMPT SMARTRETAIL DA2 EXECUTION COMPLETED SUCCESSFULLY!
PROMPT =========================================================================;

SPOOL OFF;
