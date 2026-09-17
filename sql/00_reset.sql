-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 00_reset.sql
-- DESCRIPTION: Safely drops all pre-existing SmartRetail objects (views, tables,
--              sequences, procedures, functions, triggers) in the current schema.
-- TARGET: Oracle Database 11g / 12c / 19c / 21c / 23c
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 00_reset.sql — Resetting SmartRetail Database Objects
PROMPT =========================================================================;

-- Verify connected schema user
SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

BEGIN
    DBMS_OUTPUT.PUT_LINE('Starting teardown of existing SmartRetail objects...');
END;
/

-- -----------------------------------------------------------------------------
-- 1. DROP PROCEDURES & FUNCTIONS
-- -----------------------------------------------------------------------------
DECLARE
    PROCEDURE drop_object(p_type VARCHAR2, p_name VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE 'DROP ' || p_type || ' ' || p_name;
        DBMS_OUTPUT.PUT_LINE('Dropped ' || p_type || ': ' || p_name);
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE != -4043 THEN -- ORA-04043: object does not exist
                DBMS_OUTPUT.PUT_LINE('Warning dropping ' || p_name || ': ' || SQLERRM);
            END IF;
    END;
BEGIN
    drop_object('PROCEDURE', 'PROCESS_SALE');
    drop_object('PROCEDURE', 'RECEIVE_SHIPMENT');
    drop_object('PROCEDURE', 'TRANSFER_STOCK');
    drop_object('PROCEDURE', 'CREATE_PURCHASE_ORDER');
    drop_object('FUNCTION',  'CALCULATE_SALE_TOTAL');
    drop_object('FUNCTION',  'CALCULATE_STOCK_VALUE');
    drop_object('FUNCTION',  'CALCULATE_LOYALTY_POINTS');
END;
/

-- -----------------------------------------------------------------------------
-- 2. DROP VIEWS
-- -----------------------------------------------------------------------------
DECLARE
    PROCEDURE drop_view(p_name VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE 'DROP VIEW ' || p_name;
        DBMS_OUTPUT.PUT_LINE('Dropped VIEW: ' || p_name);
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE != -942 THEN -- ORA-00942: table or view does not exist
                DBMS_OUTPUT.PUT_LINE('Warning dropping view ' || p_name || ': ' || SQLERRM);
            END IF;
    END;
BEGIN
    drop_view('vw_low_stock');
    drop_view('vw_product_stock');
    drop_view('vw_monthly_sales');
    drop_view('vw_top_selling_products');
    drop_view('vw_supplier_performance');
END;
/

-- -----------------------------------------------------------------------------
-- 3. DROP TABLES (Reverse Dependency Order with CASCADE CONSTRAINTS PURGE)
-- -----------------------------------------------------------------------------
DECLARE
    TYPE tab_list IS TABLE OF VARCHAR2(50);
    v_tables tab_list := tab_list(
        'Payment',
        'SalesTransactionLine',
        'SalesTransaction',
        'CustomerPhone',
        'Customer',
        'ReorderTrigger',
        'RestockEvent',
        'InventoryTransaction',
        'InventoryStock',
        'InventoryLocation',
        'ShipmentLine',
        'Shipment',
        'PurchaseOrderLine',
        'PurchaseOrder',
        'Employee',
        'Product',
        'ProductCategory',
        'SupplierPhone',
        'Supplier'
    );
BEGIN
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TABLE ' || v_tables(i) || ' CASCADE CONSTRAINTS PURGE';
            DBMS_OUTPUT.PUT_LINE('Dropped TABLE: ' || v_tables(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE != -942 THEN -- ORA-00942: table or view does not exist
                    DBMS_OUTPUT.PUT_LINE('Warning dropping table ' || v_tables(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

-- -----------------------------------------------------------------------------
-- 4. DROP SEQUENCES
-- -----------------------------------------------------------------------------
DECLARE
    TYPE seq_list IS TABLE OF VARCHAR2(50);
    v_seqs seq_list := seq_list(
        'SEQ_SUPPLIER_ID',
        'SEQ_CATEGORY_ID',
        'SEQ_PRODUCT_ID',
        'SEQ_EMPLOYEE_ID',
        'SEQ_PO_ID',
        'SEQ_SHIPMENT_ID',
        'SEQ_LOCATION_ID',
        'SEQ_INV_TXN_ID',
        'SEQ_RESTOCK_ID',
        'SEQ_TRIGGER_ID',
        'SEQ_CUSTOMER_ID',
        'SEQ_SALES_TXN_ID',
        'SEQ_PAYMENT_ID'
    );
BEGIN
    FOR i IN 1..v_seqs.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP SEQUENCE ' || v_seqs(i);
            DBMS_OUTPUT.PUT_LINE('Dropped SEQUENCE: ' || v_seqs(i));
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE != -2289 THEN -- ORA-02289: sequence does not exist
                    DBMS_OUTPUT.PUT_LINE('Warning dropping sequence ' || v_seqs(i) || ': ' || SQLERRM);
                END IF;
        END;
    END LOOP;
END;
/

BEGIN
    DBMS_OUTPUT.PUT_LINE('SmartRetail schema reset successfully completed.');
END;
/
