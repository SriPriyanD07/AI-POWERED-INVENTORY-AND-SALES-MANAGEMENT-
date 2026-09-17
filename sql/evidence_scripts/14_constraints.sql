-- 14_constraints.sql: Constraint Enforcement Summary
SET LINESIZE 140 PAGESIZE 60 FEEDBACK ON;
COLUMN constraint_type FORMAT A25 HEADING "CONSTRAINT_TYPE";
COLUMN total_count FORMAT 999999 HEADING "ACTIVE_CONSTRAINTS";

SELECT CASE constraint_type
         WHEN 'P' THEN 'PRIMARY KEY (PK)'
         WHEN 'R' THEN 'FOREIGN KEY (FK)'
         WHEN 'U' THEN 'UNIQUE KEY (UK)'
         WHEN 'C' THEN 'CHECK / NOT NULL (CK/NN)'
       END AS constraint_type,
       COUNT(*) AS total_count
FROM user_constraints
WHERE table_name IN (
  'SUPPLIER','SUPPLIERPHONE','PRODUCTCATEGORY','PRODUCT','EMPLOYEE',
  'PURCHASEORDER','PURCHASEORDERLINE','SHIPMENT','SHIPMENTLINE',
  'INVENTORYLOCATION','INVENTORYSTOCK','INVENTORYTRANSACTION',
  'RESTOCKEVENT','REORDERTRIGGER','CUSTOMER','CUSTOMERPHONE',
  'SALESTRANSACTION','SALESTRANSACTIONLINE','PAYMENT'
)
GROUP BY constraint_type
ORDER BY constraint_type;

PROMPT =========================================================================;
PROMPT SAMPLE OF ACTIVE EXPLICIT BUSINESS CONSTRAINTS
PROMPT =========================================================================;
COLUMN table_name FORMAT A20 HEADING "TABLE_NAME";
COLUMN constraint_name FORMAT A28 HEADING "CONSTRAINT_NAME";
COLUMN constraint_type FORMAT A5 HEADING "TYPE";
SELECT table_name, constraint_name, constraint_type
FROM user_constraints
WHERE table_name IN ('PRODUCT', 'INVENTORYLOCATION', 'INVENTORYSTOCK', 'PURCHASEORDER', 'SALESTRANSACTION')
  AND constraint_name NOT LIKE 'SYS_%'
ORDER BY table_name, constraint_name;
