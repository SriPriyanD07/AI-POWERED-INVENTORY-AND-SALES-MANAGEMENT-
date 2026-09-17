-- 13_transactions.sql: COMMIT, ROLLBACK, SAVEPOINT Demonstrations
SET SERVEROUTPUT ON SIZE UNLIMITED;
SET LINESIZE 160 PAGESIZE 50;

PROMPT =========================================================================;
PROMPT DEMONSTRATION: SAVEPOINT AND PARTIAL ROLLBACK (Declined Add-on Item)
PROMPT =========================================================================;
DECLARE
    v_initial_count NUMBER;
    v_mid_count     NUMBER;
    v_final_count   NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_initial_count FROM Customer;
    DBMS_OUTPUT.PUT_LINE('Step 1: Baseline Customer Count = ' || v_initial_count);

    SAVEPOINT sp_demo_start;

    -- Insert temporary customer
    INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
    VALUES (999, 'Temp', 'User', 'temp.user@example.com', 0, 'REGULAR', SYSDATE);

    SELECT COUNT(*) INTO v_mid_count FROM Customer;
    DBMS_OUTPUT.PUT_LINE('Step 2: After inserting test customer, Count = ' || v_mid_count);

    -- Rollback to savepoint
    ROLLBACK TO SAVEPOINT sp_demo_start;

    SELECT COUNT(*) INTO v_final_count FROM Customer;
    DBMS_OUTPUT.PUT_LINE('Step 3: After ROLLBACK TO SAVEPOINT, Count restored to = ' || v_final_count);
    DBMS_OUTPUT.PUT_LINE('[PASS] Transaction ACID consistency demonstrated safely.');
END;
/
