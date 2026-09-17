-- =============================================================================
-- SMARTRETAIL DBMS MINI-PROJECT (DA2)
-- SCRIPT: 03_sample_data.sql
-- DESCRIPTION: Comprehensive, realistic supermarket dataset populating all 19
--              relations to satisfy all query, view, procedure, and trigger tests.
-- =============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET DEFINE OFF;

PROMPT =========================================================================;
PROMPT EXECUTING 03_sample_data.sql — Populating Supermarket Sample Data
PROMPT =========================================================================;

SELECT USER AS current_schema_user, TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') AS execution_timestamp FROM dual;

-- -----------------------------------------------------------------------------
-- 1. POPULATE: Supplier (5 Suppliers)
-- -----------------------------------------------------------------------------
INSERT INTO Supplier (supplier_id, supplier_name, contact_person, email, gst_number, street, city, state, pincode, rating, created_at)
VALUES (1, 'Heritage Agro & Dairy Ltd', 'Ramesh Sharma', 'ramesh@heritageagro.in', 'GSTIN29AABCH1234F1Z1', 'Plot 45, Peenya Industrial Area', 'Bengaluru', 'Karnataka', '560058', 4.75, DATE '2025-01-10');

INSERT INTO Supplier (supplier_id, supplier_name, contact_person, email, gst_number, street, city, state, pincode, rating, created_at)
VALUES (2, 'Britannia Fresh Distribution', 'Pooja Iyer', 'orders@britanniafresh.com', 'GSTIN33AABCB5678M1Z2', '12 SIDCO Industrial Estate', 'Chennai', 'Tamil Nadu', '600098', 4.60, DATE '2025-01-15');

INSERT INTO Supplier (supplier_id, supplier_name, contact_person, email, gst_number, street, city, state, pincode, rating, created_at)
VALUES (3, 'Himalayan Pure Beverages', 'Vikram Singh', 'sales@himalayanbev.in', 'GSTIN07AABCH9012N1Z3', '88 Okhla Phase III', 'New Delhi', 'Delhi', '110020', 4.30, DATE '2025-02-01');

INSERT INTO Supplier (supplier_id, supplier_name, contact_person, email, gst_number, street, city, state, pincode, rating, created_at)
VALUES (4, 'Godrej Consumer Goods Hub', 'Ananya Patel', 'support@godrejhub.com', 'GSTIN27AABCG3456P1Z4', '102 Vikhroli West', 'Mumbai', 'Maharashtra', '400079', 4.80, DATE '2025-02-10');

INSERT INTO Supplier (supplier_id, supplier_name, contact_person, email, gst_number, street, city, state, pincode, rating, created_at)
VALUES (5, 'Organic Harvest Mills', 'Kiran Verma', 'kiran@organicharvest.org', 'GSTIN03AABCO7890K1Z5', '5 GT Road', 'Amritsar', 'Punjab', '143001', 4.15, DATE '2025-03-01');

-- -----------------------------------------------------------------------------
-- 2. POPULATE: SupplierPhone (Multi-Valued Phone Numbers)
-- -----------------------------------------------------------------------------
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (1, '+91-9845012345');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (1, '+91-080-28394050');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (2, '+91-9444054321');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (2, '+91-044-22501020');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (3, '+91-9811098765');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (4, '+91-9820067890');
INSERT INTO SupplierPhone (supplier_id, phone_number) VALUES (5, '+91-9876011223');

-- -----------------------------------------------------------------------------
-- 3. POPULATE: ProductCategory (Hierarchical Categories)
-- -----------------------------------------------------------------------------
-- Top Level Root Categories
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (1, 'Dairy & Refrigerated', NULL);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (2, 'Bakery & Snacks', NULL);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (3, 'Beverages', NULL);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (4, 'Personal Care & Hygiene', NULL);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (5, 'Staples & Grains', NULL);

-- Sub-Categories (Hierarchical)
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (6, 'Fresh Milk & Cream', 1);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (7, 'Butter & Cheese', 1);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (8, 'Artisan Breads', 2);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (9, 'Cookies & Biscuits', 2);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (10, 'Packaged Juices', 3);
INSERT INTO ProductCategory (category_id, category_name, parent_category_id) VALUES (11, 'Tea & Coffee', 3);

-- -----------------------------------------------------------------------------
-- 4. POPULATE: Product (15 Products Across Categories)
-- -----------------------------------------------------------------------------
INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (1, 'SKU-DRY-001', '8901030010011', 'Heritage Full Cream Milk 1L', 'Pasteurized homogenized cow milk pouch', 6, 'LITER', 64.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (2, 'SKU-DRY-002', '8901030010028', 'Amul Salted Butter 500g', 'Rich pasteurized table butter slab', 7, 'PACK', 275.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (3, 'SKU-DRY-003', '8901030010035', 'Amul Processed Cheese Blocks 400g', 'Pure cheddar cheese cubes block', 7, 'PACK', 310.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (4, 'SKU-BAK-001', '8901030020010', 'Britannia Whole Wheat Bread 400g', '100 percent whole wheat brown sandwich loaf', 8, 'PACK', 50.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (5, 'SKU-BAK-002', '8901030020027', 'Britannia Good Day Butter Cookies 250g', 'Cashew and butter shortbread cookies', 9, 'PACK', 45.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (6, 'SKU-BAK-003', '8901030020034', 'Bourbon Chocolate Cream Biscuits 150g', 'Chocolate sandwich biscuits with sugar crystals', 9, 'PACK', 35.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (7, 'SKU-BEV-001', '8901030030019', 'Real Fruit Power Mixed Fruit Juice 1L', 'Reconstituted 100 percent fruit blend juice', 10, 'TETRAPACK', 120.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (8, 'SKU-BEV-002', '8901030030026', 'Tropicana 100 Orange Juice 1L', 'No added sugar pure orange juice', 10, 'TETRAPACK', 145.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (9, 'SKU-BEV-003', '8901030030033', 'Tata Tea Gold Leaf 500g', 'Exquisite black tea leaves with gently pressed leaves', 11, 'PACK', 320.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (10, 'SKU-BEV-004', '8901030030040', 'Nescafe Classic Instant Coffee 200g', '100 percent pure robusta instant coffee jar', 11, 'JAR', 460.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (11, 'SKU-PER-001', '8901030040018', 'Godrej Cinthol Original Soap 125g (Pack of 3)', 'Deodorant and germ protection bath soap', 4, 'PACK', 140.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (12, 'SKU-PER-002', '8901030040025', 'Godrej Protekt Germ Liquid Handwash 500ml', 'Neem and aloe vera hand cleanser pump', 4, 'BOTTLE', 99.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (13, 'SKU-STP-001', '8901030050017', 'Organic Harvest Sona Masoori Rice 5kg', 'Aged unpolished aromatic medium grain rice', 5, 'BAG', 390.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (14, 'SKU-STP-002', '8901030050024', 'Organic Harvest Whole Sharbati Atta 5kg', 'Chakki ground golden wheat flour bag', 5, 'BAG', 285.00, 'TRUE');

INSERT INTO Product (product_id, sku, barcode, product_name, description, category_id, unit_of_measure, standard_unit_price, is_active)
VALUES (15, 'SKU-STP-003', '8901030050031', 'Organic Toor Dal Unpolished 1kg', 'High protein premium yellow pigeon peas', 5, 'PACK', 175.00, 'TRUE');

-- -----------------------------------------------------------------------------
-- 5. POPULATE: Employee (6 Employees Across Roles)
-- -----------------------------------------------------------------------------
INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (1, 'Sunil Joshi', 'MANAGER', 'sunil.joshi@smartretail.com', '+91-9844011111', DATE '2023-01-15');

INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (2, 'Divya Nair', 'CASHIER', 'divya.nair@smartretail.com', '+91-9844022222', DATE '2023-06-01');

INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (3, 'Karthik Subramanian', 'CASHIER', 'karthik.sub@smartretail.com', '+91-9844033333', DATE '2023-08-15');

INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (4, 'Amit Sen', 'PROCUREMENT_OFFICER', 'amit.sen@smartretail.com', '+91-9844044444', DATE '2023-03-10');

INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (5, 'Rajesh Goud', 'WAREHOUSE_STAFF', 'rajesh.goud@smartretail.com', '+91-9844055555', DATE '2023-04-20');

INSERT INTO Employee (employee_id, full_name, role, email, phone, hire_date)
VALUES (6, 'Meenakshi Rao', 'ADMIN', 'meenakshi.rao@smartretail.com', '+91-9844066666', DATE '2022-11-01');

-- -----------------------------------------------------------------------------
-- 6. POPULATE: PurchaseOrder (4 Purchase Orders)
-- -----------------------------------------------------------------------------
INSERT INTO PurchaseOrder (po_id, po_number, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, is_auto_generated)
VALUES (1, 'PO-2026-001', 1, 4, DATE '2026-02-01', DATE '2026-02-05', 'COMPLETED', 29000.00, 'FALSE');

INSERT INTO PurchaseOrder (po_id, po_number, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, is_auto_generated)
VALUES (2, 'PO-2026-002', 2, 4, DATE '2026-02-10', DATE '2026-02-14', 'PARTIALLY_RECEIVED', 13500.00, 'FALSE');

INSERT INTO PurchaseOrder (po_id, po_number, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, is_auto_generated)
VALUES (3, 'PO-2026-003', 3, 4, DATE '2026-02-20', DATE '2026-02-25', 'SHIPPED', 23000.00, 'TRUE');

INSERT INTO PurchaseOrder (po_id, po_number, supplier_id, created_by, order_date, expected_delivery_date, status, total_amount, is_auto_generated)
VALUES (4, 'PO-2026-004', 5, 4, DATE '2026-03-01', DATE '2026-03-07', 'APPROVED', 44500.00, 'FALSE');

-- -----------------------------------------------------------------------------
-- 7. POPULATE: PurchaseOrderLine (Lines for Purchase Orders)
-- -----------------------------------------------------------------------------
-- PO 1 Lines (Supplier 1: Dairy)
    -- Milk 300L @ 50 = 15000
    -- Butter 40 @ 220 = 8800
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (1, 1, 300, 50.00);
    -- Cheese 20 @ 260 = 5200 (Total = 29000)
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (1, 2, 40, 220.00);
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (1, 3, 20, 260.00);

-- PO 2 Lines (Supplier 2: Bakery)
    -- Bread 150 @ 40 = 6000
    -- GoodDay 150 @ 32 = 4800
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (2, 4, 150, 40.00);
    -- Bourbon 100 @ 27 = 2700 (Total = 13500)
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (2, 5, 150, 32.00);
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (2, 6, 100, 27.00);

-- PO 3 Lines (Supplier 3: Beverages)
    -- Juice Mix 100 @ 95 = 9500
    -- Juice Orange 100 @ 115 = 11500
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (3, 7, 100, 95.00);
    -- Tea 20 @ 100 = 2000 (Total = 23000)
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (3, 8, 100, 115.00);
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (3, 9, 20, 100.00);

-- PO 4 Lines (Supplier 5: Staples)
    -- Rice 70 @ 320 = 22400
    -- Atta 60 @ 235 = 14100
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (4, 13, 70, 320.00);
    -- Toor Dal 50 @ 160 = 8000 (Total = 44500)
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (4, 14, 60, 235.00);
INSERT INTO PurchaseOrderLine (po_id, product_id, quantity_ordered, unit_price) VALUES (4, 15, 50, 160.00);

-- -----------------------------------------------------------------------------
-- 8. POPULATE: Shipment (3 Shipments: Full, Partial, In-Transit)
-- -----------------------------------------------------------------------------
-- Shipment 1: Fully received for PO 1
INSERT INTO Shipment (shipment_id, tracking_number, po_id, carrier, shipment_date, received_date, status, received_by)
VALUES (1, 'TRK-IND-902181', 1, 'BlueDart Express', DATE '2026-02-02', DATE '2026-02-04', 'RECEIVED', 5);

-- Shipment 2: Partial shipment for PO 2
INSERT INTO Shipment (shipment_id, tracking_number, po_id, carrier, shipment_date, received_date, status, received_by)
VALUES (2, 'TRK-IND-902182', 2, 'Delhivery Logistics', DATE '2026-02-11', DATE '2026-02-13', 'PARTIALLY_RECEIVED', 5);

-- Shipment 3: In-transit for PO 3
INSERT INTO Shipment (shipment_id, tracking_number, po_id, carrier, shipment_date, received_date, status, received_by)
VALUES (3, 'TRK-IND-902183', 3, 'GATI KWE FastCargo', DATE '2026-02-21', NULL, 'IN_TRANSIT', NULL);

-- -----------------------------------------------------------------------------
-- 9. POPULATE: ShipmentLine (Shipment Line Items)
-- -----------------------------------------------------------------------------
-- Shipment 1 Lines (Full Delivery)
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (1, 1, 300, 300);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (1, 2, 40, 40);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (1, 3, 20, 20);

-- Shipment 2 Lines (Partial Delivery Demonstration)
    -- Partial: 90 of 150 received
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (2, 4, 150, 150);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (2, 5, 150, 90);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (2, 6, 100, 0);

-- Shipment 3 Lines (In Transit)
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (3, 7, 100, 0);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (3, 8, 100, 0);
INSERT INTO ShipmentLine (shipment_id, product_id, quantity_shipped, quantity_received) VALUES (3, 9, 20, 0);

-- -----------------------------------------------------------------------------
-- 10. POPULATE: InventoryLocation (Warehouses & Shelves with Hierarchy)
-- -----------------------------------------------------------------------------
-- Parent Warehouses
INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (1, 'WH-CENTRAL-01', 'WAREHOUSE', 'Central Ambient Warehouse Hub', NULL, 50000, NULL, 'ZONE-NORTH-DRY');

INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (2, 'WH-COLD-01', 'WAREHOUSE', 'Central Cold Storage & Chillers', NULL, 15000, NULL, 'ZONE-COLD-CHILL');

-- Retail Store Shelves (Children of Warehouses)
INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (3, 'SH-DAIRY-01', 'SHELF', 'Front Chilled Dairy Showcase', 2, 400, 'Aisle-01', 'STORE-FRONT-COLD');

INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (4, 'SH-BAKERY-01', 'SHELF', 'Fresh Bakery Island Shelf', 1, 300, 'Aisle-03', 'STORE-MID-BAKERY');

INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (5, 'SH-BEV-01', 'SHELF', 'Beverages & TetraPack Wall Shelf', 1, 500, 'Aisle-02', 'STORE-FRONT-BEV');

INSERT INTO InventoryLocation (location_id, location_code, location_type, location_name, parent_location_id, capacity, aisle_number, zone)
VALUES (6, 'SH-STAPLES-01', 'SHELF', 'Bulk Grains & Staples Gondola', 1, 600, 'Aisle-06', 'STORE-BACK-GRAINS');

-- -----------------------------------------------------------------------------
-- 11. POPULATE: InventoryStock (Product × Location Live Stock Levels)
-- -----------------------------------------------------------------------------
-- Dairy Stock (Warehouse 2 & Shelf 3)
    -- Milk in Cold Warehouse
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (2, 1, 180, 50, 100, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (3, 1, 8, 15, 30, SYSTIMESTAMP);

INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (2, 2, 35, 10, 25, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (3, 2, 12, 5, 15, SYSTIMESTAMP);

INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (2, 3, 18, 5, 15, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (3, 3, 10, 4, 10, SYSTIMESTAMP);

-- Bakery Stock (Warehouse 1 & Shelf 4)
    -- Bread in Central Warehouse
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 4, 120, 30, 80, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (4, 4, 25, 10, 40, SYSTIMESTAMP);

INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 5, 60, 20, 50, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (4, 5, 6, 12, 30, SYSTIMESTAMP);

-- Beverages Stock (Warehouse 1 & Shelf 5)
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 7, 75, 25, 50, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (5, 7, 18, 8, 20, SYSTIMESTAMP);

INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 8, 40, 20, 40, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (5, 8, 14, 6, 15, SYSTIMESTAMP);

INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 9, 25, 30, 40, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (5, 9, 15, 5, 15, SYSTIMESTAMP);

-- Staples Stock (Warehouse 1 & Shelf 6)
    -- Rice in Warehouse
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 13, 50, 15, 30, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (6, 13, 15, 5, 15, SYSTIMESTAMP);

    -- Atta in Warehouse
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (1, 14, 45, 15, 30, SYSTIMESTAMP);
INSERT INTO InventoryStock (location_id, product_id, quantity_on_hand, reorder_threshold, reorder_quantity, last_updated_at)
VALUES (6, 14, 12, 5, 15, SYSTIMESTAMP);

-- -----------------------------------------------------------------------------
-- 12. POPULATE: Customer (5 Customers with Loyalty Points & Tiers)
-- -----------------------------------------------------------------------------
INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (1, 'Aditya', 'Verma', 'aditya.verma@gmail.com', 450, 'SILVER', DATE '2024-04-12');

INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (2, 'Priya', 'Sundaram', 'priya.sundaram@yahoo.co.in', 1350, 'PLATINUM', DATE '2023-09-20');

INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (3, 'Rahul', 'Deshmukh', 'rahul.deshmukh@outlook.com', 620, 'GOLD', DATE '2024-01-18');

INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (4, 'Sneha', 'Kapoor', 'sneha.kapoor@gmail.com', 85, 'REGULAR', DATE '2025-01-05');

INSERT INTO Customer (customer_id, first_name, last_name, email, loyalty_points, membership_type, registered_date)
VALUES (5, 'Vikrant', 'Chauhan', 'vikrant.c@techcorp.in', 0, 'REGULAR', DATE '2025-02-14');

-- -----------------------------------------------------------------------------
-- 13. POPULATE: CustomerPhone (Customer Multi-Valued Phones)
-- -----------------------------------------------------------------------------
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (1, '+91-9871122334');
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (2, '+91-9884455667');
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (2, '+91-044-24991234');
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (3, '+91-9823344556');
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (4, '+91-9810099887');
INSERT INTO CustomerPhone (customer_id, phone_number) VALUES (5, '+91-9988776655');

-- -----------------------------------------------------------------------------
-- 14. POPULATE: SalesTransaction (3 Completed Sales: Registered, Guest, Split)
-- -----------------------------------------------------------------------------
-- Sale 1: Regular Customer Sale (Customer 1, Cashier 2)
INSERT INTO SalesTransaction (transaction_id, receipt_number, customer_id, cashier_id, transaction_date, total_amount, status)
VALUES (1, 'RCP-2026-0001', 1, 2, TIMESTAMP '2026-02-15 10:30:00', 403.00, 'COMPLETED');

-- Sale 2: Guest Customer Walk-in Sale (customer_id IS NULL, Cashier 3)
INSERT INTO SalesTransaction (transaction_id, receipt_number, customer_id, cashier_id, transaction_date, total_amount, status)
VALUES (2, 'RCP-2026-0002', NULL, 3, TIMESTAMP '2026-02-15 11:45:00', 165.00, 'COMPLETED');

-- Sale 3: Customer Sale with Split Payment Demonstration (Customer 2, Cashier 2)
INSERT INTO SalesTransaction (transaction_id, receipt_number, customer_id, cashier_id, transaction_date, total_amount, status)
VALUES (3, 'RCP-2026-0003', 2, 2, TIMESTAMP '2026-02-16 14:15:00', 1140.00, 'COMPLETED');

-- -----------------------------------------------------------------------------
-- 15. POPULATE: SalesTransactionLine (Line Items Sold from Shelf Locations)
-- -----------------------------------------------------------------------------
-- Sale 1 Lines (Total: 403.00)
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (1, 1, 3, 2, 64.00);
    -- 1 Butter @ 275 = 275.00
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (1, 2, 3, 1, 275.00);

-- Sale 2 Lines (Total: 165.00)
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (2, 4, 4, 1, 50.00);
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (2, 5, 4, 1, 45.00);
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (2, 6, 4, 2, 35.00);

-- Sale 3 Lines (Total: 1140.00)
    -- 2 Mixed Juice @ 120 = 240.00
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (3, 7, 5, 2, 120.00);
    -- 1 Tea @ 320 = 320.00
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (3, 9, 5, 1, 320.00);
    -- 1 Rice 5kg @ 390 = 390.00
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (3, 13, 6, 1, 390.00);
    -- 1 Orange Juice @ 190 = 190.00
INSERT INTO SalesTransactionLine (transaction_id, product_id, shelf_location_id, quantity_sold, unit_price)
VALUES (3, 8, 5, 1, 190.00);

-- -----------------------------------------------------------------------------
-- 16. POPULATE: Payment (Single and Split Payment Demonstration)
-- -----------------------------------------------------------------------------
-- Payment for Sale 1: Single UPI Payment (403.00)
INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, reference_number, status)
VALUES (1, 1, 'UPI', 403.00, TIMESTAMP '2026-02-15 10:32:00', 'UPI-REF-99882211', 'SUCCESS');

-- Payment for Sale 2: Single Cash Payment (165.00)
INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, reference_number, status)
VALUES (2, 2, 'CASH', 165.00, TIMESTAMP '2026-02-15 11:46:00', NULL, 'SUCCESS');

-- Payments for Sale 3: Split Payment (Total 1140.00 = 700.00 Card + 440.00 Wallet)
INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, reference_number, status)
VALUES (3, 3, 'CREDIT_CARD', 700.00, TIMESTAMP '2026-02-16 14:16:00', 'TXN-HDFC-991201', 'SUCCESS');

INSERT INTO Payment (payment_id, transaction_id, payment_method, amount, payment_date, reference_number, status)
VALUES (4, 3, 'WALLET', 440.00, TIMESTAMP '2026-02-16 14:17:00', 'PAYTM-WLT-554433', 'SUCCESS');

-- -----------------------------------------------------------------------------
-- 17. POPULATE: InventoryTransaction (Audit Ledger of Inbound, Transfers, Sales)
-- -----------------------------------------------------------------------------
-- Inbound Receipts from Shipment 1
INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (1, 1, 2, 'RECEIPT', 300, TIMESTAMP '2026-02-04 11:00:00', 'SHIPMENT', 1);

INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (2, 2, 2, 'RECEIPT', 40, TIMESTAMP '2026-02-04 11:05:00', 'SHIPMENT', 1);

INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (3, 3, 2, 'RECEIPT', 20, TIMESTAMP '2026-02-04 11:10:00', 'SHIPMENT', 1);

-- Restock Transfer from Cold Warehouse (Loc 2) to Front Shelf (Loc 3)
INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (4, 1, 2, 'TRANSFER_OUT', -50, TIMESTAMP '2026-02-06 08:30:00', 'RESTOCK', 1);

INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (5, 1, 3, 'TRANSFER_IN', 50, TIMESTAMP '2026-02-06 08:35:00', 'RESTOCK', 1);

-- Sales Deductions from Shelf (Linked to Sale 1)
INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (6, 1, 3, 'SALE', -2, TIMESTAMP '2026-02-15 10:30:00', 'SALE', 1);

INSERT INTO InventoryTransaction (transaction_id, product_id, location_id, transaction_type, quantity, transaction_date, reference_type, reference_id)
VALUES (7, 2, 3, 'SALE', -1, TIMESTAMP '2026-02-15 10:30:00', 'SALE', 1);

-- -----------------------------------------------------------------------------
-- 18. POPULATE: RestockEvent (Internal Shelf Replenishment History)
-- -----------------------------------------------------------------------------
INSERT INTO RestockEvent (restock_id, product_id, from_location_id, to_location_id, quantity_moved, event_date, triggered_by, performed_by, status)
VALUES (1, 1, 2, 3, 50, TIMESTAMP '2026-02-06 08:30:00', 'AUTO_THRESHOLD', 5, 'COMPLETED');

INSERT INTO RestockEvent (restock_id, product_id, from_location_id, to_location_id, quantity_moved, event_date, triggered_by, performed_by, status)
VALUES (2, 4, 1, 4, 40, TIMESTAMP '2026-02-10 09:00:00', 'MANUAL_REQUEST', 5, 'COMPLETED');

INSERT INTO RestockEvent (restock_id, product_id, from_location_id, to_location_id, quantity_moved, event_date, triggered_by, performed_by, status)
VALUES (3, 5, 1, 4, 30, TIMESTAMP '2026-02-16 16:00:00', 'AUTO_THRESHOLD', NULL, 'PENDING');

-- -----------------------------------------------------------------------------
-- 19. POPULATE: ReorderTrigger (Warehouse Replenishment Alerts)
-- -----------------------------------------------------------------------------
INSERT INTO ReorderTrigger (trigger_id, product_id, location_id, stock_at_trigger, threshold_at_trigger, trigger_date, generated_po_id, status)
VALUES (1, 7, 1, 20, 25, TIMESTAMP '2026-02-18 10:00:00', 3, 'PO_CREATED');

INSERT INTO ReorderTrigger (trigger_id, product_id, location_id, stock_at_trigger, threshold_at_trigger, trigger_date, generated_po_id, status)
VALUES (2, 9, 1, 25, 30, TIMESTAMP '2026-02-28 17:30:00', NULL, 'OPEN');

COMMIT;

-- Synchronize Sequences to highest explicit IDs to prevent DUP_VAL_ON_INDEX on subsequent auto-inserts
DECLARE
    v_max_id NUMBER;
    v_cur_seq NUMBER;
    PROCEDURE sync_seq(p_seq_name VARCHAR2, p_table_name VARCHAR2, p_col_name VARCHAR2) IS
        v_diff NUMBER;
        v_temp NUMBER;
    BEGIN
        EXECUTE IMMEDIATE 'SELECT NVL(MAX(' || p_col_name || '), 0) FROM ' || p_table_name INTO v_max_id;
        EXECUTE IMMEDIATE 'SELECT ' || p_seq_name || '.NEXTVAL FROM dual' INTO v_cur_seq;
        v_diff := v_max_id - v_cur_seq;
        IF v_diff > 0 THEN
            EXECUTE IMMEDIATE 'ALTER SEQUENCE ' || p_seq_name || ' INCREMENT BY ' || v_diff;
            EXECUTE IMMEDIATE 'SELECT ' || p_seq_name || '.NEXTVAL FROM dual' INTO v_temp;
            EXECUTE IMMEDIATE 'ALTER SEQUENCE ' || p_seq_name || ' INCREMENT BY 1';
        END IF;
    END;
BEGIN
    sync_seq('SEQ_SUPPLIER_ID',  'Supplier',             'supplier_id');
    sync_seq('SEQ_CATEGORY_ID',  'ProductCategory',      'category_id');
    sync_seq('SEQ_PRODUCT_ID',   'Product',              'product_id');
    sync_seq('SEQ_EMPLOYEE_ID',  'Employee',             'employee_id');
    sync_seq('SEQ_PO_ID',        'PurchaseOrder',        'po_id');
    sync_seq('SEQ_SHIPMENT_ID',  'Shipment',             'shipment_id');
    sync_seq('SEQ_LOCATION_ID',  'InventoryLocation',    'location_id');
    sync_seq('SEQ_INV_TXN_ID',   'InventoryTransaction', 'transaction_id');
    sync_seq('SEQ_RESTOCK_ID',   'RestockEvent',         'restock_id');
    sync_seq('SEQ_TRIGGER_ID',   'ReorderTrigger',       'trigger_id');
    sync_seq('SEQ_CUSTOMER_ID',  'Customer',             'customer_id');
    sync_seq('SEQ_SALES_TXN_ID', 'SalesTransaction',     'transaction_id');
    sync_seq('SEQ_PAYMENT_ID',   'Payment',              'payment_id');
    DBMS_OUTPUT.PUT_LINE('Sequences successfully synchronized with seed data IDs.');
END;
/

-- Verify row counts in all 19 relations
PROMPT Verifying Row Counts across all 19 Relations:
SELECT 'Supplier' AS relation_name, COUNT(*) AS row_count FROM Supplier UNION ALL
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

PROMPT 03_sample_data.sql completed successfully.
