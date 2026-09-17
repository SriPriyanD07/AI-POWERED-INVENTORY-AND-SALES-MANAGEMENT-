-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 02_constraints.sql
-- DESCRIPTION: Applies explicit, meaningful Foreign Keys, Unique Keys, and
--              Check Constraints across all 19 approved SmartRetail relations.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 02_constraints.sql — Applying Explicit Integrity Constraints
PROMPT =========================================================================;

SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

-- -----------------------------------------------------------------------------
-- 1. CONSTRAINTS: Supplier
-- -----------------------------------------------------------------------------
ALTER TABLE Supplier ADD CONSTRAINT UK_SUPPLIER_EMAIL UNIQUE (email);
ALTER TABLE Supplier ADD CONSTRAINT UK_SUPPLIER_GST UNIQUE (gst_number);
ALTER TABLE Supplier ADD CONSTRAINT CK_SUPPLIER_RATING CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0));

-- -----------------------------------------------------------------------------
-- 2. CONSTRAINTS: SupplierPhone
-- -----------------------------------------------------------------------------
ALTER TABLE SupplierPhone ADD CONSTRAINT FK_SUPP_PHONE_SUPP 
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 3. CONSTRAINTS: ProductCategory
-- -----------------------------------------------------------------------------
ALTER TABLE ProductCategory ADD CONSTRAINT UK_CATEGORY_NAME UNIQUE (category_name);
ALTER TABLE ProductCategory ADD CONSTRAINT FK_CAT_PARENT 
    FOREIGN KEY (parent_category_id) REFERENCES ProductCategory(category_id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4. CONSTRAINTS: Product
-- -----------------------------------------------------------------------------
ALTER TABLE Product ADD CONSTRAINT UK_PRODUCT_SKU UNIQUE (sku);
ALTER TABLE Product ADD CONSTRAINT UK_PRODUCT_BARCODE UNIQUE (barcode);
ALTER TABLE Product ADD CONSTRAINT FK_PROD_CATEGORY 
    FOREIGN KEY (category_id) REFERENCES ProductCategory(category_id);
ALTER TABLE Product ADD CONSTRAINT CK_PRODUCT_PRICE CHECK (standard_unit_price > 0);
ALTER TABLE Product ADD CONSTRAINT CK_PRODUCT_ACTIVE CHECK (is_active IN ('TRUE', 'FALSE'));

-- -----------------------------------------------------------------------------
-- 5. CONSTRAINTS: Employee
-- -----------------------------------------------------------------------------
ALTER TABLE Employee ADD CONSTRAINT UK_EMPLOYEE_EMAIL UNIQUE (email);
ALTER TABLE Employee ADD CONSTRAINT CK_EMPLOYEE_ROLE 
    CHECK (role IN ('CASHIER', 'MANAGER', 'PROCUREMENT_OFFICER', 'WAREHOUSE_STAFF', 'ADMIN'));

-- -----------------------------------------------------------------------------
-- 6. CONSTRAINTS: PurchaseOrder
-- -----------------------------------------------------------------------------
ALTER TABLE PurchaseOrder ADD CONSTRAINT UK_PO_NUMBER UNIQUE (po_number);
ALTER TABLE PurchaseOrder ADD CONSTRAINT FK_PO_SUPPLIER 
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id);
ALTER TABLE PurchaseOrder ADD CONSTRAINT FK_PO_EMPLOYEE 
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id);
ALTER TABLE PurchaseOrder ADD CONSTRAINT CK_PO_STATUS 
    CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'));
ALTER TABLE PurchaseOrder ADD CONSTRAINT CK_PO_TOTAL CHECK (total_amount IS NULL OR total_amount >= 0);
ALTER TABLE PurchaseOrder ADD CONSTRAINT CK_PO_AUTO CHECK (is_auto_generated IN ('TRUE', 'FALSE'));

-- -----------------------------------------------------------------------------
-- 7. CONSTRAINTS: PurchaseOrderLine
-- -----------------------------------------------------------------------------
ALTER TABLE PurchaseOrderLine ADD CONSTRAINT FK_POL_PO 
    FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id) ON DELETE CASCADE;
ALTER TABLE PurchaseOrderLine ADD CONSTRAINT FK_POL_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE PurchaseOrderLine ADD CONSTRAINT CK_POL_QTY CHECK (quantity_ordered > 0);
ALTER TABLE PurchaseOrderLine ADD CONSTRAINT CK_POL_PRICE CHECK (unit_price > 0);

-- -----------------------------------------------------------------------------
-- 8. CONSTRAINTS: Shipment
-- -----------------------------------------------------------------------------
ALTER TABLE Shipment ADD CONSTRAINT UK_SHIPMENT_TRACKING UNIQUE (tracking_number);
ALTER TABLE Shipment ADD CONSTRAINT FK_SHP_PO 
    FOREIGN KEY (po_id) REFERENCES PurchaseOrder(po_id);
ALTER TABLE Shipment ADD CONSTRAINT FK_SHP_EMPLOYEE 
    FOREIGN KEY (received_by) REFERENCES Employee(employee_id);
ALTER TABLE Shipment ADD CONSTRAINT CK_SHIPMENT_STATUS 
    CHECK (status IS NULL OR status IN ('IN_TRANSIT', 'DELIVERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'));

-- -----------------------------------------------------------------------------
-- 9. CONSTRAINTS: ShipmentLine
-- -----------------------------------------------------------------------------
ALTER TABLE ShipmentLine ADD CONSTRAINT FK_SHPL_SHIPMENT 
    FOREIGN KEY (shipment_id) REFERENCES Shipment(shipment_id) ON DELETE CASCADE;
ALTER TABLE ShipmentLine ADD CONSTRAINT FK_SHPL_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE ShipmentLine ADD CONSTRAINT CK_SHPL_QTY_SHIPPED CHECK (quantity_shipped > 0);
ALTER TABLE ShipmentLine ADD CONSTRAINT CK_SHPL_QTY_RCVD CHECK (quantity_received >= 0);

-- -----------------------------------------------------------------------------
-- 10. CONSTRAINTS: InventoryLocation
-- -----------------------------------------------------------------------------
ALTER TABLE InventoryLocation ADD CONSTRAINT UK_LOCATION_CODE UNIQUE (location_code);
ALTER TABLE InventoryLocation ADD CONSTRAINT CK_LOCATION_TYPE 
    CHECK (location_type IN ('WAREHOUSE', 'SHELF'));
ALTER TABLE InventoryLocation ADD CONSTRAINT FK_LOC_PARENT 
    FOREIGN KEY (parent_location_id) REFERENCES InventoryLocation(location_id) ON DELETE SET NULL;
ALTER TABLE InventoryLocation ADD CONSTRAINT CK_LOC_CAPACITY CHECK (capacity IS NULL OR capacity > 0);

-- -----------------------------------------------------------------------------
-- 11. CONSTRAINTS: InventoryStock
-- -----------------------------------------------------------------------------
ALTER TABLE InventoryStock ADD CONSTRAINT FK_STOCK_LOCATION 
    FOREIGN KEY (location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE InventoryStock ADD CONSTRAINT FK_STOCK_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE InventoryStock ADD CONSTRAINT CK_STOCK_QOH CHECK (quantity_on_hand >= 0);
ALTER TABLE InventoryStock ADD CONSTRAINT CK_STOCK_THRESHOLD CHECK (reorder_threshold >= 0);
ALTER TABLE InventoryStock ADD CONSTRAINT CK_STOCK_REORDER_QTY CHECK (reorder_quantity > 0);

-- -----------------------------------------------------------------------------
-- 12. CONSTRAINTS: InventoryTransaction
-- -----------------------------------------------------------------------------
ALTER TABLE InventoryTransaction ADD CONSTRAINT FK_ITXN_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE InventoryTransaction ADD CONSTRAINT FK_ITXN_LOCATION 
    FOREIGN KEY (location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE InventoryTransaction ADD CONSTRAINT CK_ITXN_TYPE 
    CHECK (transaction_type IN ('RECEIPT', 'TRANSFER_IN', 'TRANSFER_OUT', 'SALE', 'ADJUSTMENT'));
ALTER TABLE InventoryTransaction ADD CONSTRAINT CK_ITXN_REF_TYPE 
    CHECK (reference_type IS NULL OR reference_type IN ('SHIPMENT', 'RESTOCK', 'SALE', 'MANUAL'));

-- -----------------------------------------------------------------------------
-- 13. CONSTRAINTS: RestockEvent
-- -----------------------------------------------------------------------------
ALTER TABLE RestockEvent ADD CONSTRAINT FK_RESTOCK_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE RestockEvent ADD CONSTRAINT FK_RESTOCK_FROM_LOC 
    FOREIGN KEY (from_location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE RestockEvent ADD CONSTRAINT FK_RESTOCK_TO_LOC 
    FOREIGN KEY (to_location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE RestockEvent ADD CONSTRAINT FK_RESTOCK_EMPLOYEE 
    FOREIGN KEY (performed_by) REFERENCES Employee(employee_id);
ALTER TABLE RestockEvent ADD CONSTRAINT CK_RESTOCK_QTY CHECK (quantity_moved > 0);
ALTER TABLE RestockEvent ADD CONSTRAINT CK_RESTOCK_STATUS 
    CHECK (status IS NULL OR status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- -----------------------------------------------------------------------------
-- 14. CONSTRAINTS: ReorderTrigger
-- -----------------------------------------------------------------------------
ALTER TABLE ReorderTrigger ADD CONSTRAINT FK_REORDER_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE ReorderTrigger ADD CONSTRAINT FK_REORDER_LOCATION 
    FOREIGN KEY (location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE ReorderTrigger ADD CONSTRAINT FK_REORDER_PO 
    FOREIGN KEY (generated_po_id) REFERENCES PurchaseOrder(po_id);
ALTER TABLE ReorderTrigger ADD CONSTRAINT CK_REORDER_STATUS 
    CHECK (status IS NULL OR status IN ('OPEN', 'PO_CREATED', 'RESOLVED', 'IGNORED'));

-- -----------------------------------------------------------------------------
-- 15. CONSTRAINTS: Customer
-- -----------------------------------------------------------------------------
ALTER TABLE Customer ADD CONSTRAINT UK_CUSTOMER_EMAIL UNIQUE (email);
ALTER TABLE Customer ADD CONSTRAINT CK_CUSTOMER_POINTS CHECK (loyalty_points >= 0);
ALTER TABLE Customer ADD CONSTRAINT CK_MEMBERSHIP_TYPE 
    CHECK (membership_type IS NULL OR membership_type IN ('REGULAR', 'SILVER', 'GOLD', 'PLATINUM'));

-- -----------------------------------------------------------------------------
-- 16. CONSTRAINTS: CustomerPhone
-- -----------------------------------------------------------------------------
ALTER TABLE CustomerPhone ADD CONSTRAINT FK_CUST_PHONE_CUST 
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 17. CONSTRAINTS: SalesTransaction
-- -----------------------------------------------------------------------------
ALTER TABLE SalesTransaction ADD CONSTRAINT UK_SALES_RECEIPT UNIQUE (receipt_number);
ALTER TABLE SalesTransaction ADD CONSTRAINT FK_SALES_CUSTOMER 
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id);
ALTER TABLE SalesTransaction ADD CONSTRAINT FK_SALES_CASHIER 
    FOREIGN KEY (cashier_id) REFERENCES Employee(employee_id);
ALTER TABLE SalesTransaction ADD CONSTRAINT CK_SALES_TOTAL CHECK (total_amount IS NULL OR total_amount >= 0);
ALTER TABLE SalesTransaction ADD CONSTRAINT CK_SALES_STATUS 
    CHECK (status IS NULL OR status IN ('COMPLETED', 'VOID', 'REFUNDED'));

-- -----------------------------------------------------------------------------
-- 18. CONSTRAINTS: SalesTransactionLine
-- -----------------------------------------------------------------------------
ALTER TABLE SalesTransactionLine ADD CONSTRAINT FK_STL_TRANSACTION 
    FOREIGN KEY (transaction_id) REFERENCES SalesTransaction(transaction_id) ON DELETE CASCADE;
ALTER TABLE SalesTransactionLine ADD CONSTRAINT FK_STL_PRODUCT 
    FOREIGN KEY (product_id) REFERENCES Product(product_id);
ALTER TABLE SalesTransactionLine ADD CONSTRAINT FK_STL_SHELF_LOC 
    FOREIGN KEY (shelf_location_id) REFERENCES InventoryLocation(location_id);
ALTER TABLE SalesTransactionLine ADD CONSTRAINT CK_STL_QTY CHECK (quantity_sold > 0);
ALTER TABLE SalesTransactionLine ADD CONSTRAINT CK_STL_PRICE CHECK (unit_price > 0);

-- -----------------------------------------------------------------------------
-- 19. CONSTRAINTS: Payment
-- -----------------------------------------------------------------------------
ALTER TABLE Payment ADD CONSTRAINT FK_PAYMENT_TRANSACTION 
    FOREIGN KEY (transaction_id) REFERENCES SalesTransaction(transaction_id);
ALTER TABLE Payment ADD CONSTRAINT CK_PAYMENT_METHOD 
    CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'POINTS'));
ALTER TABLE Payment ADD CONSTRAINT CK_PAYMENT_AMOUNT CHECK (amount > 0);
ALTER TABLE Payment ADD CONSTRAINT CK_PAYMENT_STATUS 
    CHECK (status IS NULL OR status IN ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'));

-- -----------------------------------------------------------------------------
-- VERIFY APPLIED CONSTRAINTS
-- -----------------------------------------------------------------------------
PROMPT Summary of Applied Constraints in Schema:
SELECT constraint_type, COUNT(*) AS count_of_constraints
FROM user_constraints
WHERE table_name IN (
    'SUPPLIER', 'SUPPLIERPHONE', 'PRODUCTCATEGORY', 'PRODUCT', 'EMPLOYEE',
    'PURCHASEORDER', 'PURCHASEORDERLINE', 'SHIPMENT', 'SHIPMENTLINE',
    'INVENTORYLOCATION', 'INVENTORYSTOCK', 'INVENTORYTRANSACTION',
    'RESTOCKEVENT', 'REORDERTRIGGER', 'CUSTOMER', 'CUSTOMERPHONE',
    'SALESTRANSACTION', 'SALESTRANSACTIONLINE', 'PAYMENT'
)
GROUP BY constraint_type
ORDER BY constraint_type;

PROMPT 02_constraints.sql completed successfully.
