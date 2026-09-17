-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 12_exceptions.sql
-- DESCRIPTION: Implementation and demonstration of Oracle Predefined Exceptions
--              (NO_DATA_FOUND, TOO_MANY_ROWS, DUP_VAL_ON_INDEX, OTHERS) and
--              User-Defined Exceptions with RAISE and DBMS_OUTPUT reporting.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 12_exceptions.sql — Demonstrating PL/SQL Exception Handling
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. PREDEFINED EXCEPTION: NO_DATA_FOUND
-- Scenario: Querying for a non-existent customer record by ID (e.g. ID = 9999).
-- -----------------------------------------------------------------------------
PROMPT === 1. Demonstrating NO_DATA_FOUND Exception ===
DECLARE
    v_cust_name  VARCHAR2(200);
    v_target_id  NUMBER := 9999;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting SELECT INTO for non-existent Customer ID: ' || v_target_id);

    SELECT first_name || ' ' || last_name
    INTO v_cust_name
    FROM Customer
    WHERE customer_id = v_target_id;

    DBMS_OUTPUT.PUT_LINE('Customer Name: ' || v_cust_name);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('--> CAUGHT NO_DATA_FOUND: No customer exists with ID ' || v_target_id);
        DBMS_OUTPUT.PUT_LINE('    Handled gracefully without terminating session.');
END;
/

-- -----------------------------------------------------------------------------
-- 2. PREDEFINED EXCEPTION: TOO_MANY_ROWS
-- Scenario: Single-row SELECT INTO where multiple employees share role 'CASHIER'.
-- -----------------------------------------------------------------------------
PROMPT === 2. Demonstrating TOO_MANY_ROWS Exception ===
DECLARE
    v_emp_name VARCHAR2(150);
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting single-row SELECT INTO for role = CASHIER (multiple rows exist)...');

    SELECT full_name
    INTO v_emp_name
    FROM Employee
    WHERE role = 'CASHIER';

    DBMS_OUTPUT.PUT_LINE('Employee Name: ' || v_emp_name);
EXCEPTION
    WHEN TOO_MANY_ROWS THEN
        DBMS_OUTPUT.PUT_LINE('--> CAUGHT TOO_MANY_ROWS: Multiple employees matched role CASHIER.');
        DBMS_OUTPUT.PUT_LINE('    Solution: Use an explicit cursor or aggregate function instead.');
END;
/

-- -----------------------------------------------------------------------------
-- 3. PREDEFINED EXCEPTION: DUP_VAL_ON_INDEX
-- Scenario: Attempting to insert a Product with an existing unique SKU ('SKU-DRY-001').
-- -----------------------------------------------------------------------------
PROMPT === 3. Demonstrating DUP_VAL_ON_INDEX Exception ===
DECLARE
    v_dup_sku VARCHAR2(50) := 'SKU-DRY-001';
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting to insert duplicate SKU: ' || v_dup_sku);

    INSERT INTO Product (
        product_id, sku, barcode, product_name, description, 
        category_id, unit_of_measure, standard_unit_price, is_active
    ) VALUES (
        998, v_dup_sku, '8909999999999', 'Duplicate Test Milk', 'Test Description',
        6, 'LITER', 60.00, 'TRUE'
    );

    DBMS_OUTPUT.PUT_LINE('Insert unexpectedly succeeded.');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('--> CAUGHT DUP_VAL_ON_INDEX: Unique constraint violated on SKU (' || 
                             v_dup_sku || ').');
        DBMS_OUTPUT.PUT_LINE('    Insert rejected; integrity of product catalog preserved.');
END;
/

-- -----------------------------------------------------------------------------
-- 4. USER-DEFINED EXCEPTION
-- Scenario: Business rule validation: Shelf capacity overflow.
--           If stock to be placed exceeds location capacity, raise custom exception.
-- -----------------------------------------------------------------------------
PROMPT === 4. Demonstrating User-Defined Exception: EX_CAPACITY_EXCEEDED ===
DECLARE
    ex_capacity_exceeded EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_capacity_exceeded, -20050);

    v_target_location NUMBER := 3; -- Shelf 3 has capacity 400
    v_incoming_units  NUMBER := 1500;
    v_capacity        NUMBER;
    v_current_total   NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Validating shelf restocking capacity for Location ' || v_target_location || '...');

    SELECT capacity INTO v_capacity
    FROM InventoryLocation
    WHERE location_id = v_target_location;

    SELECT NVL(SUM(quantity_on_hand), 0) INTO v_current_total
    FROM InventoryStock
    WHERE location_id = v_target_location;

    DBMS_OUTPUT.PUT_LINE('Current Stock on Shelf: ' || v_current_total || 
                         ' | Max Capacity: ' || v_capacity || 
                         ' | Incoming Restock: ' || v_incoming_units);

    IF (v_current_total + v_incoming_units) > v_capacity THEN
        RAISE_APPLICATION_ERROR(-20050, 'Shelf capacity exceeded! Available space=' || 
                                (v_capacity - v_current_total) || ', Incoming=' || v_incoming_units);
    END IF;
EXCEPTION
    WHEN ex_capacity_exceeded THEN
        DBMS_OUTPUT.PUT_LINE('--> CAUGHT USER-DEFINED EXCEPTION (-20050):');
        DBMS_OUTPUT.PUT_LINE('    ' || SQLERRM);
END;
/

-- -----------------------------------------------------------------------------
-- 5. GENERAL EXCEPTION HANDLER: OTHERS with SQLCODE & SQLERRM
-- Scenario: Catch-all block capturing division by zero or any unpredicted error.
-- -----------------------------------------------------------------------------
PROMPT === 5. Demonstrating OTHERS Exception Handler with SQLCODE & SQLERRM ===
DECLARE
    v_num1 NUMBER := 500;
    v_num2 NUMBER := 0;
    v_res  NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting division: ' || v_num1 || ' / ' || v_num2);
    v_res := v_num1 / v_num2;
    DBMS_OUTPUT.PUT_LINE('Result: ' || v_res);
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('--> CAUGHT IN OTHERS HANDLER:');
        DBMS_OUTPUT.PUT_LINE('    SQLCODE = ' || SQLCODE);
        DBMS_OUTPUT.PUT_LINE('    SQLERRM = ' || SQLERRM);
END;
/

PROMPT 12_exceptions.sql completed successfully.
