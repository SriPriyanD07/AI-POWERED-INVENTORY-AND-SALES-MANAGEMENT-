-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 14_transactions.sql
-- DESCRIPTION: Transaction Control demonstrations showcasing ACID properties:
--              1. Successful Multi-step Transaction with COMMIT
--              2. Failed Transaction with Complete ROLLBACK
--              3. Multi-item POS Checkout with SAVEPOINT & ROLLBACK TO SAVEPOINT
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 14_transactions.sql — Demonstrating Transaction Control (ACID)
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- SCENARIO 1: SUCCESSFUL MULTI-STEP TRANSACTION (COMMIT)
-- Description: Customer 3 buys 2 units of Good Day cookies (Product 5) from Shelf 4.
-- Steps:
--   1. Record SalesTransaction header
--   2. Record SalesTransactionLine
--   3. Record Settlement in Payment (UPI)
--   4. Deduct Shelf Stock
--   5. Record SALE ledger row in InventoryTransaction
--   6. COMMIT transaction to make changes durable.
-- -----------------------------------------------------------------------------
PROMPT === Scenario 1: Multi-Step Sales Settlement with COMMIT ===

PROMPT [State Before]: Shelf Stock for Product 5 at Shelf 4:
SELECT location_id, product_id, quantity_on_hand FROM InventoryStock WHERE location_id = 4 AND product_id = 5;

DECLARE
    v_new_txn_id NUMBER;
BEGIN
    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO v_new_txn_id FROM dual;

    -- 1. Insert Sales Header
    INSERT INTO SalesTransaction (
        transaction_id, receipt_number, customer_id, cashier_id,
        transaction_date, total_amount, status
    ) VALUES (
        v_new_txn_id, 'RCP-TXN-DEMO-01', 3, 2,
        SYSTIMESTAMP, 90.00, 'COMPLETED'
    );

    -- 2. Insert Sales Line (2 units @ 45.00)
    INSERT INTO SalesTransactionLine (
        transaction_id, product_id, shelf_location_id, quantity_sold, unit_price
    ) VALUES (
        v_new_txn_id, 5, 4, 2, 45.00
    );

    -- 3. Record Payment
    INSERT INTO Payment (
        payment_id, transaction_id, payment_method, amount,
        payment_date, reference_number, status
    ) VALUES (
        SEQ_PAYMENT_ID.NEXTVAL, v_new_txn_id, 'UPI', 90.00,
        SYSTIMESTAMP, 'UPI-TXN-DEMO-SUCCESS', 'SUCCESS'
    );

    -- 4. Deduct Live Stock
    UPDATE InventoryStock
    SET quantity_on_hand = quantity_on_hand - 2,
        last_updated_at = SYSTIMESTAMP
    WHERE location_id = 4 AND product_id = 5;

    -- 5. Record Ledger Entry
    INSERT INTO InventoryTransaction (
        transaction_id, product_id, location_id, transaction_type,
        quantity, transaction_date, reference_type, reference_id
    ) VALUES (
        SEQ_INV_TXN_ID.NEXTVAL, 5, 4, 'SALE',
        -2, SYSTIMESTAMP, 'SALE', v_new_txn_id
    );

    -- 6. COMMIT
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--> Scenario 1 COMMITTED successfully. TxnID=' || v_new_txn_id);
END;
/

PROMPT [State After COMMIT]: Shelf Stock for Product 5 at Shelf 4 (Decremented by 2):
SELECT location_id, product_id, quantity_on_hand FROM InventoryStock WHERE location_id = 4 AND product_id = 5;

-- -----------------------------------------------------------------------------
-- SCENARIO 2: FAILED TRANSACTION WITH COMPLETE ROLLBACK
-- Description: Attempt to process a sale, but payment fails. The entire transaction
--              is rolled back, restoring stock and header state to previous state.
-- -----------------------------------------------------------------------------
PROMPT === Scenario 2: Payment Decline & Full ROLLBACK Demonstration ===

PROMPT [State Before Failed Attempt]: Stock for Product 1 at Shelf 3:
SELECT location_id, product_id, quantity_on_hand FROM InventoryStock WHERE location_id = 3 AND product_id = 1;

DECLARE
    v_fail_txn_id NUMBER;
    v_payment_successful BOOLEAN := FALSE; -- Simulating failed card authorization
BEGIN
    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO v_fail_txn_id FROM dual;

    -- 1. Insert Sales Header
    INSERT INTO SalesTransaction (
        transaction_id, receipt_number, customer_id, cashier_id,
        transaction_date, total_amount, status
    ) VALUES (
        v_fail_txn_id, 'RCP-FAIL-DEMO-02', 4, 3,
        SYSTIMESTAMP, 128.00, 'PENDING'
    );

    -- 2. Insert Sales Line (2 Milk @ 64.00)
    INSERT INTO SalesTransactionLine (
        transaction_id, product_id, shelf_location_id, quantity_sold, unit_price
    ) VALUES (
        v_fail_txn_id, 1, 3, 2, 64.00
    );

    -- 3. Tentative Stock Deduction
    UPDATE InventoryStock
    SET quantity_on_hand = quantity_on_hand - 2
    WHERE location_id = 3 AND product_id = 1;

    DBMS_OUTPUT.PUT_LINE('Sales Line created. Verifying payment gateway authorization...');

    -- 4. Check payment authorization
    IF NOT v_payment_successful THEN
        DBMS_OUTPUT.PUT_LINE('Card declined! Executing ROLLBACK to restore uncommitted state...');
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('--> ROLLBACK completed. No orphaned records created.');
    END IF;
END;
/

PROMPT [State After ROLLBACK]: Verifying stock was NOT decremented:
SELECT location_id, product_id, quantity_on_hand FROM InventoryStock WHERE location_id = 3 AND product_id = 1;

PROMPT Verifying SalesTransaction record was NOT persisted:
SELECT COUNT(*) AS should_be_zero FROM SalesTransaction WHERE receipt_number = 'RCP-FAIL-DEMO-02';

-- -----------------------------------------------------------------------------
-- SCENARIO 3: SAVEPOINT & ROLLBACK TO SAVEPOINT
-- Description: Multi-item basket checkout where customer cancels one item at checkout.
-- Steps:
--   1. Add Item A (Real Mixed Juice, Product 7) -> SAVEPOINT sp_after_item_a
--   2. Add Item B (Tata Tea, Product 9)        -> SAVEPOINT sp_after_item_b
--   3. Customer decides not to purchase Item B -> ROLLBACK TO SAVEPOINT sp_after_item_a
--   4. Complete and COMMIT checkout with Item A only.
-- -----------------------------------------------------------------------------
PROMPT === Scenario 3: SAVEPOINT and Partial Rollback Demonstration ===

DECLARE
    v_cart_txn_id NUMBER;
    v_tea_stock_before NUMBER;
BEGIN
    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO v_cart_txn_id FROM dual;

    SELECT quantity_on_hand INTO v_tea_stock_before
    FROM InventoryStock WHERE location_id = 5 AND product_id = 9;

    DBMS_OUTPUT.PUT_LINE('Starting POS Basket: Initial Tea QOH = ' || v_tea_stock_before);

    -- Header
    INSERT INTO SalesTransaction (
        transaction_id, receipt_number, customer_id, cashier_id,
        transaction_date, total_amount, status
    ) VALUES (
        v_cart_txn_id, 'RCP-SAVEPOINT-03', 1, 2,
        SYSTIMESTAMP, 0.00, 'COMPLETED'
    );

    -- Add Item A: 1 Mixed Fruit Juice @ 120.00
    INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
    VALUES (v_cart_txn_id, 7, 5, 1, 120.00);

    UPDATE InventoryStock SET quantity_on_hand = quantity_on_hand - 1
    WHERE location_id = 5 AND product_id = 7;

    -- SAVEPOINT 1: Item A securely in basket
    SAVEPOINT sp_after_item_a;
    DBMS_OUTPUT.PUT_LINE('Marked SAVEPOINT: sp_after_item_a (Item A added)');

    -- Add Item B: 1 Tata Tea Gold @ 320.00
    INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
    VALUES (v_cart_txn_id, 9, 5, 1, 320.00);

    UPDATE InventoryStock SET quantity_on_hand = quantity_on_hand - 1
    WHERE location_id = 5 AND product_id = 9;

    DBMS_OUTPUT.PUT_LINE('Added Item B (Tea). Temporary Tea QOH decremented.');

    -- Customer changes mind and declines Item B
    DBMS_OUTPUT.PUT_LINE('Customer cancels Item B. Rolling back to SAVEPOINT sp_after_item_a...');
    ROLLBACK TO SAVEPOINT sp_after_item_a;

    -- Update total amount to reflect only Item A
    UPDATE SalesTransaction SET total_amount = 120.00 WHERE transaction_id = v_cart_txn_id;

    -- Record Payment for Item A
    INSERT INTO Payment (
        payment_id, transaction_id, payment_method, amount,
        payment_date, reference_number, status
    ) VALUES (
        SEQ_PAYMENT_ID.NEXTVAL, v_cart_txn_id, 'CASH', 120.00,
        SYSTIMESTAMP, NULL, 'SUCCESS'
    );

    -- Final COMMIT of remaining basket
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('--> Partial transaction COMMITTED. Only Item A was finalized.');
END;
/

PROMPT [State After SAVEPOINT Partial Rollback]: Verifying lines attached to RCP-SAVEPOINT-03:
SELECT stl.transaction_id, stl.product_id, p.product_name, stl.quantity_sold, stl.unit_price
FROM SalesTransactionLine stl
INNER JOIN Product p ON stl.product_id = p.product_id
INNER JOIN SalesTransaction st ON stl.transaction_id = st.transaction_id
WHERE st.receipt_number = 'RCP-SAVEPOINT-03';

PROMPT Verifying Tea stock was restored back to original:
SELECT location_id, product_id, quantity_on_hand 
FROM InventoryStock WHERE location_id = 5 AND product_id = 9;

PROMPT 14_transactions.sql completed successfully.
