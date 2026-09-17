-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 01_schema.sql
-- DESCRIPTION: DDL creation of all 19 approved SmartRetail relations and sequences
--              in strict dependency order for Oracle 11g / 12c / 19c+.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 01_schema.sql — Creating Sequences and 19 Relations
PROMPT =========================================================================;

SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

-- -----------------------------------------------------------------------------
-- 1. CREATE SEQUENCES FOR SURROGATE KEYS
-- -----------------------------------------------------------------------------
CREATE SEQUENCE SEQ_SUPPLIER_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_CATEGORY_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PRODUCT_ID    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_EMPLOYEE_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PO_ID         START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_SHIPMENT_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_LOCATION_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_INV_TXN_ID    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_RESTOCK_ID    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_TRIGGER_ID    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_CUSTOMER_ID   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_SALES_TXN_ID  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE SEQ_PAYMENT_ID    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- -----------------------------------------------------------------------------
-- 2. TABLE 1: Supplier
-- -----------------------------------------------------------------------------
CREATE TABLE Supplier (
    supplier_id     NUMBER(10)          NOT NULL,
    supplier_name   VARCHAR2(200)       NOT NULL,
    contact_person  VARCHAR2(100),
    email           VARCHAR2(150)       NOT NULL,
    gst_number      VARCHAR2(50)        NOT NULL,
    street          VARCHAR2(200),
    city            VARCHAR2(100),
    state           VARCHAR2(100),
    pincode         VARCHAR2(20),
    rating          NUMBER(3,2),
    created_at      DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_SUPPLIER PRIMARY KEY (supplier_id)
);

CREATE OR REPLACE TRIGGER TRG_SUPPLIER_ID_SEQ
BEFORE INSERT ON Supplier
FOR EACH ROW
WHEN (NEW.supplier_id IS NULL)
BEGIN
    SELECT SEQ_SUPPLIER_ID.NEXTVAL INTO :NEW.supplier_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 3. TABLE 2: SupplierPhone (1NF Multi-Valued Phone Weak Entity)
-- -----------------------------------------------------------------------------
CREATE TABLE SupplierPhone (
    supplier_id     NUMBER(10)          NOT NULL,
    phone_number    VARCHAR2(20)        NOT NULL,
    CONSTRAINT PK_SUPPLIER_PHONE PRIMARY KEY (supplier_id, phone_number)
);

-- -----------------------------------------------------------------------------
-- 4. TABLE 3: ProductCategory (Hierarchical Categories)
-- -----------------------------------------------------------------------------
CREATE TABLE ProductCategory (
    category_id         NUMBER(10)      NOT NULL,
    category_name       VARCHAR2(100)   NOT NULL,
    parent_category_id  NUMBER(10),
    CONSTRAINT PK_PRODUCT_CATEGORY PRIMARY KEY (category_id)
);

CREATE OR REPLACE TRIGGER TRG_CATEGORY_ID_SEQ
BEFORE INSERT ON ProductCategory
FOR EACH ROW
WHEN (NEW.category_id IS NULL)
BEGIN
    SELECT SEQ_CATEGORY_ID.NEXTVAL INTO :NEW.category_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 5. TABLE 4: Product
-- -----------------------------------------------------------------------------
CREATE TABLE Product (
    product_id          NUMBER(10)      NOT NULL,
    sku                 VARCHAR2(50)    NOT NULL,
    barcode             VARCHAR2(50)    NOT NULL,
    product_name        VARCHAR2(200)   NOT NULL,
    description         VARCHAR2(500),
    category_id         NUMBER(10)      NOT NULL,
    unit_of_measure     VARCHAR2(20)    NOT NULL,
    standard_unit_price NUMBER(10,2)    NOT NULL,
    is_active           VARCHAR2(5) DEFAULT 'TRUE' NOT NULL,
    CONSTRAINT PK_PRODUCT PRIMARY KEY (product_id)
);

CREATE OR REPLACE TRIGGER TRG_PRODUCT_ID_SEQ
BEFORE INSERT ON Product
FOR EACH ROW
WHEN (NEW.product_id IS NULL)
BEGIN
    SELECT SEQ_PRODUCT_ID.NEXTVAL INTO :NEW.product_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 6. TABLE 5: Employee
-- -----------------------------------------------------------------------------
CREATE TABLE Employee (
    employee_id     NUMBER(10)          NOT NULL,
    full_name       VARCHAR2(150)       NOT NULL,
    role            VARCHAR2(50)        NOT NULL,
    email           VARCHAR2(150)       NOT NULL,
    phone           VARCHAR2(20),
    hire_date       DATE                NOT NULL,
    CONSTRAINT PK_EMPLOYEE PRIMARY KEY (employee_id)
);

CREATE OR REPLACE TRIGGER TRG_EMPLOYEE_ID_SEQ
BEFORE INSERT ON Employee
FOR EACH ROW
WHEN (NEW.employee_id IS NULL)
BEGIN
    SELECT SEQ_EMPLOYEE_ID.NEXTVAL INTO :NEW.employee_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 7. TABLE 6: PurchaseOrder
-- -----------------------------------------------------------------------------
CREATE TABLE PurchaseOrder (
    po_id                   NUMBER(10)          NOT NULL,
    po_number               VARCHAR2(50)        NOT NULL,
    supplier_id             NUMBER(10)          NOT NULL,
    created_by              NUMBER(10)          NOT NULL,
    order_date              DATE                NOT NULL,
    expected_delivery_date  DATE,
    status                  VARCHAR2(30)        NOT NULL,
    total_amount            NUMBER(12,2) DEFAULT 0,
    is_auto_generated       VARCHAR2(5) DEFAULT 'FALSE' NOT NULL,
    CONSTRAINT PK_PURCHASE_ORDER PRIMARY KEY (po_id)
);

CREATE OR REPLACE TRIGGER TRG_PO_ID_SEQ
BEFORE INSERT ON PurchaseOrder
FOR EACH ROW
WHEN (NEW.po_id IS NULL)
BEGIN
    SELECT SEQ_PO_ID.NEXTVAL INTO :NEW.po_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 8. TABLE 7: PurchaseOrderLine (Composite PK)
-- -----------------------------------------------------------------------------
CREATE TABLE PurchaseOrderLine (
    po_id               NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    quantity_ordered    NUMBER(8)       NOT NULL,
    unit_price          NUMBER(10,2)    NOT NULL,
    CONSTRAINT PK_PURCHASE_ORDER_LINE PRIMARY KEY (po_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 9. TABLE 8: Shipment
-- -----------------------------------------------------------------------------
CREATE TABLE Shipment (
    shipment_id         NUMBER(10)      NOT NULL,
    tracking_number     VARCHAR2(100)   NOT NULL,
    po_id               NUMBER(10)      NOT NULL,
    carrier             VARCHAR2(100),
    shipment_date       DATE,
    received_date       DATE,
    status              VARCHAR2(30),
    received_by         NUMBER(10),
    CONSTRAINT PK_SHIPMENT PRIMARY KEY (shipment_id)
);

CREATE OR REPLACE TRIGGER TRG_SHIPMENT_ID_SEQ
BEFORE INSERT ON Shipment
FOR EACH ROW
WHEN (NEW.shipment_id IS NULL)
BEGIN
    SELECT SEQ_SHIPMENT_ID.NEXTVAL INTO :NEW.shipment_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 10. TABLE 9: ShipmentLine (Composite PK)
-- -----------------------------------------------------------------------------
CREATE TABLE ShipmentLine (
    shipment_id         NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    quantity_shipped    NUMBER(8)       NOT NULL,
    quantity_received   NUMBER(8) DEFAULT 0 NOT NULL,
    CONSTRAINT PK_SHIPMENT_LINE PRIMARY KEY (shipment_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 11. TABLE 10: InventoryLocation (Warehouses and Shelves)
-- -----------------------------------------------------------------------------
CREATE TABLE InventoryLocation (
    location_id         NUMBER(10)      NOT NULL,
    location_code       VARCHAR2(50)    NOT NULL,
    location_type       VARCHAR2(20)    NOT NULL,
    location_name       VARCHAR2(100)   NOT NULL,
    parent_location_id  NUMBER(10),
    capacity            NUMBER(8),
    aisle_number        VARCHAR2(20),
    zone                VARCHAR2(50),
    CONSTRAINT PK_INVENTORY_LOCATION PRIMARY KEY (location_id)
);

CREATE OR REPLACE TRIGGER TRG_LOCATION_ID_SEQ
BEFORE INSERT ON InventoryLocation
FOR EACH ROW
WHEN (NEW.location_id IS NULL)
BEGIN
    SELECT SEQ_LOCATION_ID.NEXTVAL INTO :NEW.location_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 12. TABLE 11: InventoryStock (Product × Location Live Snapshot)
-- -----------------------------------------------------------------------------
CREATE TABLE InventoryStock (
    location_id         NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    quantity_on_hand    NUMBER(8) DEFAULT 0 NOT NULL,
    reorder_threshold   NUMBER(8) DEFAULT 0 NOT NULL,
    reorder_quantity    NUMBER(8) DEFAULT 1 NOT NULL,
    last_updated_at     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT PK_INVENTORY_STOCK PRIMARY KEY (location_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 13. TABLE 12: InventoryTransaction (Immutable Stock Ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE InventoryTransaction (
    transaction_id      NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    location_id         NUMBER(10)      NOT NULL,
    transaction_type    VARCHAR2(30)    NOT NULL,
    quantity            NUMBER(8)       NOT NULL,
    transaction_date    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    reference_type      VARCHAR2(30),
    reference_id        NUMBER(10),
    CONSTRAINT PK_INVENTORY_TRANSACTION PRIMARY KEY (transaction_id)
);

CREATE OR REPLACE TRIGGER TRG_INV_TXN_ID_SEQ
BEFORE INSERT ON InventoryTransaction
FOR EACH ROW
WHEN (NEW.transaction_id IS NULL)
BEGIN
    SELECT SEQ_INV_TXN_ID.NEXTVAL INTO :NEW.transaction_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 14. TABLE 13: RestockEvent (Warehouse → Shelf Movement Event)
-- -----------------------------------------------------------------------------
CREATE TABLE RestockEvent (
    restock_id          NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    from_location_id    NUMBER(10)      NOT NULL,
    to_location_id      NUMBER(10)      NOT NULL,
    quantity_moved      NUMBER(8)       NOT NULL,
    event_date          TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    triggered_by        VARCHAR2(50),
    performed_by        NUMBER(10),
    status              VARCHAR2(30),
    CONSTRAINT PK_RESTOCK_EVENT PRIMARY KEY (restock_id)
);

CREATE OR REPLACE TRIGGER TRG_RESTOCK_ID_SEQ
BEFORE INSERT ON RestockEvent
FOR EACH ROW
WHEN (NEW.restock_id IS NULL)
BEGIN
    SELECT SEQ_RESTOCK_ID.NEXTVAL INTO :NEW.restock_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 15. TABLE 14: ReorderTrigger (Low Warehouse Stock Alert)
-- -----------------------------------------------------------------------------
CREATE TABLE ReorderTrigger (
    trigger_id              NUMBER(10)  NOT NULL,
    product_id              NUMBER(10)  NOT NULL,
    location_id             NUMBER(10)  NOT NULL,
    stock_at_trigger        NUMBER(8)   NOT NULL,
    threshold_at_trigger    NUMBER(8)   NOT NULL,
    trigger_date            TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    generated_po_id         NUMBER(10),
    status                  VARCHAR2(30),
    CONSTRAINT PK_REORDER_TRIGGER PRIMARY KEY (trigger_id)
);

CREATE OR REPLACE TRIGGER TRG_TRIGGER_ID_SEQ
BEFORE INSERT ON ReorderTrigger
FOR EACH ROW
WHEN (NEW.trigger_id IS NULL)
BEGIN
    SELECT SEQ_TRIGGER_ID.NEXTVAL INTO :NEW.trigger_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 16. TABLE 15: Customer
-- -----------------------------------------------------------------------------
CREATE TABLE Customer (
    customer_id         NUMBER(10)      NOT NULL,
    first_name          VARCHAR2(100)   NOT NULL,
    last_name           VARCHAR2(100)   NOT NULL,
    email               VARCHAR2(150)   NOT NULL,
    loyalty_points      NUMBER(8) DEFAULT 0 NOT NULL,
    membership_type     VARCHAR2(30),
    registered_date     DATE DEFAULT SYSDATE,
    CONSTRAINT PK_CUSTOMER PRIMARY KEY (customer_id)
);

CREATE OR REPLACE TRIGGER TRG_CUSTOMER_ID_SEQ
BEFORE INSERT ON Customer
FOR EACH ROW
WHEN (NEW.customer_id IS NULL)
BEGIN
    SELECT SEQ_CUSTOMER_ID.NEXTVAL INTO :NEW.customer_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 17. TABLE 16: CustomerPhone (1NF Multi-Valued Phone Weak Entity)
-- -----------------------------------------------------------------------------
CREATE TABLE CustomerPhone (
    customer_id         NUMBER(10)      NOT NULL,
    phone_number        VARCHAR2(20)    NOT NULL,
    CONSTRAINT PK_CUSTOMER_PHONE PRIMARY KEY (customer_id, phone_number)
);

-- -----------------------------------------------------------------------------
-- 18. TABLE 17: SalesTransaction (POS Header)
-- -----------------------------------------------------------------------------
CREATE TABLE SalesTransaction (
    transaction_id      NUMBER(10)      NOT NULL,
    receipt_number      VARCHAR2(50)    NOT NULL,
    customer_id         NUMBER(10),
    cashier_id          NUMBER(10)      NOT NULL,
    transaction_date    TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    total_amount        NUMBER(10,2) DEFAULT 0,
    status              VARCHAR2(20),
    CONSTRAINT PK_SALES_TRANSACTION PRIMARY KEY (transaction_id)
);

CREATE OR REPLACE TRIGGER TRG_SALES_TXN_ID_SEQ
BEFORE INSERT ON SalesTransaction
FOR EACH ROW
WHEN (NEW.transaction_id IS NULL)
BEGIN
    SELECT SEQ_SALES_TXN_ID.NEXTVAL INTO :NEW.transaction_id FROM dual;
END;
/

-- -----------------------------------------------------------------------------
-- 19. TABLE 18: SalesTransactionLine (POS Line Item)
-- -----------------------------------------------------------------------------
CREATE TABLE SalesTransactionLine (
    transaction_id      NUMBER(10)      NOT NULL,
    product_id          NUMBER(10)      NOT NULL,
    shelf_location_id   NUMBER(10)      NOT NULL,
    quantity_sold       NUMBER(8)       NOT NULL,
    unit_price          NUMBER(10,2)    NOT NULL,
    CONSTRAINT PK_SALES_TRANSACTION_LINE PRIMARY KEY (transaction_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 20. TABLE 19: Payment (Tender Settlement with Split Payment Support)
-- -----------------------------------------------------------------------------
CREATE TABLE Payment (
    payment_id          NUMBER(10)      NOT NULL,
    transaction_id      NUMBER(10)      NOT NULL,
    payment_method      VARCHAR2(30)    NOT NULL,
    amount              NUMBER(10,2)    NOT NULL,
    payment_date        TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    reference_number    VARCHAR2(100),
    status              VARCHAR2(20),
    CONSTRAINT PK_PAYMENT PRIMARY KEY (payment_id)
);

CREATE OR REPLACE TRIGGER TRG_PAYMENT_ID_SEQ
BEFORE INSERT ON Payment
FOR EACH ROW
WHEN (NEW.payment_id IS NULL)
BEGIN
    SELECT SEQ_PAYMENT_ID.NEXTVAL INTO :NEW.payment_id FROM dual;
END;
/

PROMPT All 19 relations and auto-increment triggers successfully created.
