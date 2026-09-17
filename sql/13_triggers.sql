-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 13_triggers.sql
-- DESCRIPTION: Implementation and verification of approved business triggers:
--              1. TRG_PO_LINE_TOTAL_SYNC (Maintains PurchaseOrder.total_amount)
--              2. TRG_SALE_LINE_TOTAL_SYNC (Maintains SalesTransaction.total_amount)
--              3. TRG_STOCK_THRESHOLD_ALERT (Automated RestockEvent & ReorderTrigger)
--              4. TRG_PREVENT_NEGATIVE_STOCK (Defensive stock integrity validation)
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 13_triggers.sql — Compiling and Testing Business Triggers
PROMPT =========================================================================;

-- -----------------------------------------------------------------------------
-- 1. TRIGGER: TRG_PO_LINE_TOTAL_SYNC
-- Description: Automatically synchronizes PurchaseOrder.total_amount when
--              PurchaseOrderLine rows are added, updated, or deleted.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_PO_LINE_TOTAL_SYNC
AFTER INSERT OR UPDATE OR DELETE ON PurchaseOrderLine
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        UPDATE PurchaseOrder
        SET total_amount = total_amount + (:NEW.quantity_ordered * :NEW.unit_price)
        WHERE po_id = :NEW.po_id;
    ELSIF UPDATING THEN
        UPDATE PurchaseOrder
        SET total_amount = total_amount 
                         - (:OLD.quantity_ordered * :OLD.unit_price)
                         + (:NEW.quantity_ordered * :NEW.unit_price)
        WHERE po_id = :NEW.po_id;
    ELSIF DELETING THEN
        UPDATE PurchaseOrder
        SET total_amount = total_amount - (:OLD.quantity_ordered * :OLD.unit_price)
        WHERE po_id = :OLD.po_id;
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- 2. TRIGGER: TRG_SALE_LINE_TOTAL_SYNC
-- Description: Automatically synchronizes SalesTransaction.total_amount when
--              SalesTransactionLine rows are added, updated, or deleted.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_SALE_LINE_TOTAL_SYNC
AFTER INSERT OR UPDATE OR DELETE ON SalesTransactionLine
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        UPDATE SalesTransaction
        SET total_amount = total_amount + (:NEW.quantity_sold * :NEW.unit_price)
        WHERE transaction_id = :NEW.transaction_id;
    ELSIF UPDATING THEN
        UPDATE SalesTransaction
        SET total_amount = total_amount 
                         - (:OLD.quantity_sold * :OLD.unit_price)
                         + (:NEW.quantity_sold * :NEW.unit_price)
        WHERE transaction_id = :NEW.transaction_id;
    ELSIF DELETING THEN
        UPDATE SalesTransaction
        SET total_amount = total_amount - (:OLD.quantity_sold * :OLD.unit_price)
        WHERE transaction_id = :OLD.transaction_id;
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- 3. TRIGGER: TRG_PREVENT_NEGATIVE_STOCK
-- Description: Enforces database-level constraint preventing stock from dropping
--              below zero under any circumstance.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_PREVENT_NEGATIVE_STOCK
BEFORE UPDATE OF quantity_on_hand ON InventoryStock
FOR EACH ROW
BEGIN
    IF :NEW.quantity_on_hand < 0 THEN
        RAISE_APPLICATION_ERROR(-20060, 'Trigger Alert: Stock quantity cannot be negative. Attempted QOH: ' || 
                                :NEW.quantity_on_hand);
    END IF;
END;
/

-- -----------------------------------------------------------------------------
-- 4. TRIGGER: TRG_STOCK_THRESHOLD_ALERT
-- Description: Evaluates live stock updates.
--   - For SHELF: If QOH <= reorder_threshold, auto-creates RestockEvent (Warehouse->Shelf)
--   - For WAREHOUSE: If QOH <= reorder_threshold, auto-creates ReorderTrigger
-- Avoids duplicate alerts if an open/pending event already exists.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER TRG_STOCK_THRESHOLD_ALERT
AFTER UPDATE OF quantity_on_hand ON InventoryStock
FOR EACH ROW
WHEN (NEW.quantity_on_hand <= NEW.reorder_threshold)
DECLARE
    v_loc_type    VARCHAR2(20);
    v_parent_wh   NUMBER(10);
    v_existing    NUMBER;
    v_from_wh     NUMBER(10);
BEGIN
    -- Look up location attributes
    SELECT location_type, parent_location_id
    INTO v_loc_type, v_parent_wh
    FROM InventoryLocation
    WHERE location_id = :NEW.location_id;

    IF v_loc_type = 'SHELF' THEN
        -- Check if an active PENDING restock event already exists
        SELECT COUNT(*)
        INTO v_existing
        FROM RestockEvent
        WHERE product_id = :NEW.product_id
          AND to_location_id = :NEW.location_id
          AND status IN ('PENDING', 'IN_PROGRESS');

        IF v_existing = 0 THEN
            -- Determine supply warehouse (parent warehouse or fallback to Warehouse 1)
            v_from_wh := NVL(v_parent_wh, 1);

            INSERT INTO RestockEvent (
                restock_id, product_id, from_location_id, to_location_id,
                quantity_moved, event_date, triggered_by, performed_by, status
            ) VALUES (
                SEQ_RESTOCK_ID.NEXTVAL, :NEW.product_id, v_from_wh, :NEW.location_id,
                :NEW.reorder_quantity, SYSTIMESTAMP, 'AUTO_THRESHOLD', NULL, 'PENDING'
            );
        END IF;

    ELSIF v_loc_type = 'WAREHOUSE' THEN
        -- Check if an active OPEN reorder trigger already exists
        SELECT COUNT(*)
        INTO v_existing
        FROM ReorderTrigger
        WHERE product_id = :NEW.product_id
          AND location_id = :NEW.location_id
          AND status = 'OPEN';

        IF v_existing = 0 THEN
            INSERT INTO ReorderTrigger (
                trigger_id, product_id, location_id, stock_at_trigger,
                threshold_at_trigger, trigger_date, generated_po_id, status
            ) VALUES (
                SEQ_TRIGGER_ID.NEXTVAL, :NEW.product_id, :NEW.location_id,
                :NEW.quantity_on_hand, :NEW.reorder_threshold, SYSTIMESTAMP, NULL, 'OPEN'
            );
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log or silently handle lookup anomalies to avoid blocking caller
        NULL;
END;
/

-- -----------------------------------------------------------------------------
-- DEMONSTRATE & TEST TRIGGERS
-- -----------------------------------------------------------------------------
PROMPT === Test 1: Testing TRG_SALE_LINE_TOTAL_SYNC ===
PROMPT Before inserting line into Sale 1:
SELECT transaction_id, total_amount FROM SalesTransaction WHERE transaction_id = 1;

-- Add another product line (Product 3: Cheese @ 310.00) to Sale 1
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (1, 3, 3, 1, 310.00);

PROMPT After inserting line (Expected total increase by 310.00):
SELECT transaction_id, total_amount FROM SalesTransaction WHERE transaction_id = 1;

-- Clean up test line
DELETE FROM SalesTransactionLine WHERE transaction_id = 1 AND product_id = 3;
PROMPT After deleting test line (Restored to original total):
SELECT transaction_id, total_amount FROM SalesTransaction WHERE transaction_id = 1;

PROMPT === Test 2: Testing TRG_STOCK_THRESHOLD_ALERT for SHELF ===
PROMPT Updating shelf stock of Bread (Product 4 at Shelf 4) to 5 units (threshold is 10):
SELECT location_id, product_id, quantity_on_hand, reorder_threshold 
FROM InventoryStock WHERE location_id = 4 AND product_id = 4;

UPDATE InventoryStock
SET quantity_on_hand = 5
WHERE location_id = 4 AND product_id = 4;

PROMPT Verifying auto-created RestockEvent:
SELECT restock_id, product_id, from_location_id, to_location_id, quantity_moved, triggered_by, status
FROM RestockEvent
WHERE product_id = 4 AND to_location_id = 4;

-- Reset stock back to normal
UPDATE InventoryStock SET quantity_on_hand = 25 WHERE location_id = 4 AND product_id = 4;
COMMIT;

PROMPT === Test 3: Testing TRG_PREVENT_NEGATIVE_STOCK Exception ===
DECLARE
    ex_neg_stock EXCEPTION;
    PRAGMA EXCEPTION_INIT(ex_neg_stock, -20060);
BEGIN
    DBMS_OUTPUT.PUT_LINE('Attempting to force quantity_on_hand to -50...');
    UPDATE InventoryStock
    SET quantity_on_hand = -50
    WHERE location_id = 3 AND product_id = 1;
EXCEPTION
    WHEN ex_neg_stock THEN
        DBMS_OUTPUT.PUT_LINE('--> SUCCESS: TRG_PREVENT_NEGATIVE_STOCK intercepted illegal update!');
        DBMS_OUTPUT.PUT_LINE('    ' || SQLERRM);
END;
/

PROMPT 13_triggers.sql completed successfully.
