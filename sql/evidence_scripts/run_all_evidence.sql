-- run_all_evidence.sql: Master interactive runner for capturing screenshots
-- Run this script in SQL*Plus to execute each evidence query sequentially.
SET ECHO OFF;
SET FEEDBACK ON;

PROMPT =========================================================================
PROMPT SMARTRETAIL DA2 — INTERACTIVE EVIDENCE RUNNER
PROMPT =========================================================================
PROMPT Connect to SQL*Plus as SYSTEM and run this script.
PROMPT Press ENTER to advance through each evidence demonstration.
PROMPT Capture a screenshot of your terminal window for each item.
PROMPT =========================================================================

PAUSE Press [ENTER] to execute 01_schema_tables...
@01_schema_tables.sql
PROMPT ==> Take screenshot: 01_schema_tables.png

PAUSE Press [ENTER] to execute 02_product_data...
@02_product_data.sql
PROMPT ==> Take screenshot: 02_product_data.png

PAUSE Press [ENTER] to execute 03_inventory_data...
@03_inventory_data.sql
PROMPT ==> Take screenshot: 03_inventory_data.png

PAUSE Press [ENTER] to execute 04_multi_table_join...
@04_multi_table_join.sql
PROMPT ==> Take screenshot: 04_multi_table_join.png

PAUSE Press [ENTER] to execute 05_aggregation...
@05_aggregation.sql
PROMPT ==> Take screenshot: 05_aggregation.png

PAUSE Press [ENTER] to execute 06_advanced_sql...
@06_advanced_sql.sql
PROMPT ==> Take screenshot: 06_advanced_sql.png

PAUSE Press [ENTER] to execute 07_views...
@07_views.sql
PROMPT ==> Take screenshot: 07_views.png

PAUSE Press [ENTER] to execute 08_procedures...
@08_procedures.sql
PROMPT ==> Take screenshot: 08_procedures.png

PAUSE Press [ENTER] to execute 09_functions...
@09_functions.sql
PROMPT ==> Take screenshot: 09_functions.png

PAUSE Press [ENTER] to execute 10_cursors...
@10_cursors.sql
PROMPT ==> Take screenshot: 10_cursors.png

PAUSE Press [ENTER] to execute 11_exceptions...
@11_exceptions.sql
PROMPT ==> Take screenshot: 11_exceptions.png

PAUSE Press [ENTER] to execute 12_triggers...
@12_triggers.sql
PROMPT ==> Take screenshot: 12_triggers.png

PAUSE Press [ENTER] to execute 13_transactions...
@13_transactions.sql
PROMPT ==> Take screenshot: 13_transactions.png

PAUSE Press [ENTER] to execute 14_constraints...
@14_constraints.sql
PROMPT ==> Take screenshot: 14_constraints.png

PAUSE Press [ENTER] to execute 15_final_tests...
@15_final_tests.sql
PROMPT ==> Take screenshot: 15_final_tests.png

PROMPT =========================================================================
PROMPT ALL 15 EVIDENCE DEMONSTRATIONS COMPLETED!
PROMPT Save all captured PNGs in: D:\PROJECTS\DBMS\output\DA2_EVIDENCE\screenshots\
PROMPT Then run: python D:\PROJECTS\DBMS\output\DA2_EVIDENCE\update_evidence_docx.py
PROMPT =========================================================================
