"""
SmartRetail DA3 — Python Master Seed Data Script
Script: da3_mongodb/scripts/seed_data.py
Description: Seeds identical dataset to DA2 Oracle database across all 14 collections.
"""

import os
from datetime import datetime, timezone
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


def seed_database(db_name: str = DATABASE_NAME):
    client = MongoClient(MONGODB_URI)
    db = client[db_name]

    print(f"=========================================================================")
    print(f"Seeding SmartRetail Database via Python: {db_name}")
    print(f"=========================================================================")

    collections = [
        "customers", "employees", "product_categories", "products", "suppliers",
        "inventory_locations", "inventory_stock", "inventory_transactions",
        "purchase_orders", "shipments", "sales_transactions", "payments",
        "restock_events", "reorder_triggers"
    ]

    for coll in collections:
        db[coll].delete_many({})
        print(f"Cleared collection: {coll}")

    # 1. Suppliers
    db.suppliers.insert_many([
        {
            "supplier_id": 1,
            "supplier_name": "Heritage Agro & Dairy Ltd",
            "contact_person": "Ramesh Sharma",
            "email": "ramesh@heritageagro.in",
            "gst_number": "GSTIN29AABCH1234F1Z1",
            "phone_numbers": ["+91-9845012345", "+91-080-28394050"],
            "address": {
                "street": "Plot 45, Peenya Industrial Area",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560058"
            },
            "rating": 4.75,
            "created_at": datetime(2025, 1, 10, tzinfo=timezone.utc)
        },
        {
            "supplier_id": 2,
            "supplier_name": "Britannia Fresh Distribution",
            "contact_person": "Pooja Iyer",
            "email": "orders@britanniafresh.com",
            "gst_number": "GSTIN33AABCB5678M1Z2",
            "phone_numbers": ["+91-9444054321", "+91-044-22501020"],
            "address": {
                "street": "12 SIDCO Industrial Estate",
                "city": "Chennai",
                "state": "Tamil Nadu",
                "pincode": "600098"
            },
            "rating": 4.60,
            "created_at": datetime(2025, 1, 15, tzinfo=timezone.utc)
        },
        {
            "supplier_id": 3,
            "supplier_name": "Himalayan Pure Beverages",
            "contact_person": "Vikram Singh",
            "email": "sales@himalayanbev.in",
            "gst_number": "GSTIN07AABCH9012N1Z3",
            "phone_numbers": ["+91-9811098765"],
            "address": {
                "street": "88 Okhla Phase III",
                "city": "New Delhi",
                "state": "Delhi",
                "pincode": "110020"
            },
            "rating": 4.30,
            "created_at": datetime(2025, 2, 1, tzinfo=timezone.utc)
        },
        {
            "supplier_id": 4,
            "supplier_name": "Godrej Consumer Goods Hub",
            "contact_person": "Ananya Patel",
            "email": "support@godrejhub.com",
            "gst_number": "GSTIN27AABCG3456P1Z4",
            "phone_numbers": ["+91-9820067890"],
            "address": {
                "street": "102 Vikhroli West",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400079"
            },
            "rating": 4.80,
            "created_at": datetime(2025, 2, 10, tzinfo=timezone.utc)
        },
        {
            "supplier_id": 5,
            "supplier_name": "Organic Harvest Mills",
            "contact_person": "Kiran Verma",
            "email": "kiran@organicharvest.org",
            "gst_number": "GSTIN03AABCO7890K1Z5",
            "phone_numbers": ["+91-9876011223"],
            "address": {
                "street": "5 GT Road",
                "city": "Amritsar",
                "state": "Punjab",
                "pincode": "143001"
            },
            "rating": 4.15,
            "created_at": datetime(2025, 3, 1, tzinfo=timezone.utc)
        }
    ])

    # 2. Product Categories
    db.product_categories.insert_many([
        {"category_id": 1, "category_name": "Dairy & Refrigerated", "parent_category_id": None, "category_path": "Dairy & Refrigerated"},
        {"category_id": 2, "category_name": "Bakery & Snacks", "parent_category_id": None, "category_path": "Bakery & Snacks"},
        {"category_id": 3, "category_name": "Beverages", "parent_category_id": None, "category_path": "Beverages"},
        {"category_id": 4, "category_name": "Personal Care & Hygiene", "parent_category_id": None, "category_path": "Personal Care & Hygiene"},
        {"category_id": 5, "category_name": "Staples & Grains", "parent_category_id": None, "category_path": "Staples & Grains"},
        {"category_id": 6, "category_name": "Fresh Milk & Cream", "parent_category_id": 1, "category_path": "Dairy & Refrigerated / Fresh Milk & Cream"},
        {"category_id": 7, "category_name": "Butter & Cheese", "parent_category_id": 1, "category_path": "Dairy & Refrigerated / Butter & Cheese"},
        {"category_id": 8, "category_name": "Artisan Breads", "parent_category_id": 2, "category_path": "Bakery & Snacks / Artisan Breads"},
        {"category_id": 9, "category_name": "Cookies & Biscuits", "parent_category_id": 2, "category_path": "Bakery & Snacks / Cookies & Biscuits"},
        {"category_id": 10, "category_name": "Packaged Juices", "parent_category_id": 3, "category_path": "Beverages / Packaged Juices"},
        {"category_id": 11, "category_name": "Tea & Coffee", "parent_category_id": 3, "category_path": "Beverages / Tea & Coffee"}
    ])

    # 3. Products
    db.products.insert_many([
        {"product_id": 1, "sku": "SKU-DRY-001", "barcode": "8901030010011", "product_name": "Heritage Full Cream Milk 1L", "description": "Pasteurized homogenized cow milk pouch", "category_id": 6, "category_name": "Fresh Milk & Cream", "unit_of_measure": "LITER", "standard_unit_price": 64.00, "is_active": "TRUE"},
        {"product_id": 2, "sku": "SKU-DRY-002", "barcode": "8901030010028", "product_name": "Amul Salted Butter 500g", "description": "Rich pasteurized table butter slab", "category_id": 7, "category_name": "Butter & Cheese", "unit_of_measure": "PACK", "standard_unit_price": 275.00, "is_active": "TRUE"},
        {"product_id": 3, "sku": "SKU-DRY-003", "barcode": "8901030010035", "product_name": "Amul Processed Cheese Blocks 400g", "description": "Pure cheddar cheese cubes block", "category_id": 7, "category_name": "Butter & Cheese", "unit_of_measure": "PACK", "standard_unit_price": 310.00, "is_active": "TRUE"},
        {"product_id": 4, "sku": "SKU-BAK-001", "barcode": "8901030020010", "product_name": "Britannia Whole Wheat Bread 400g", "description": "100 percent whole wheat brown sandwich loaf", "category_id": 8, "category_name": "Artisan Breads", "unit_of_measure": "PACK", "standard_unit_price": 50.00, "is_active": "TRUE"},
        {"product_id": 5, "sku": "SKU-BAK-002", "barcode": "8901030020027", "product_name": "Britannia Good Day Butter Cookies 250g", "description": "Cashew and butter shortbread cookies", "category_id": 9, "category_name": "Cookies & Biscuits", "unit_of_measure": "PACK", "standard_unit_price": 45.00, "is_active": "TRUE"},
        {"product_id": 6, "sku": "SKU-BAK-003", "barcode": "8901030020034", "product_name": "Bourbon Chocolate Cream Biscuits 150g", "description": "Chocolate sandwich biscuits with sugar crystals", "category_id": 9, "category_name": "Cookies & Biscuits", "unit_of_measure": "PACK", "standard_unit_price": 35.00, "is_active": "TRUE"},
        {"product_id": 7, "sku": "SKU-BEV-001", "barcode": "8901030030019", "product_name": "Real Fruit Power Mixed Fruit Juice 1L", "description": "Reconstituted 100 percent fruit blend juice", "category_id": 10, "category_name": "Packaged Juices", "unit_of_measure": "TETRAPACK", "standard_unit_price": 120.00, "is_active": "TRUE"},
        {"product_id": 8, "sku": "SKU-BEV-002", "barcode": "8901030030026", "product_name": "Tropicana 100 Orange Juice 1L", "description": "No added sugar pure orange juice", "category_id": 10, "category_name": "Packaged Juices", "unit_of_measure": "TETRAPACK", "standard_unit_price": 145.00, "is_active": "TRUE"},
        {"product_id": 9, "sku": "SKU-BEV-003", "barcode": "8901030030033", "product_name": "Tata Tea Gold Leaf 500g", "description": "Exquisite black tea leaves with gently pressed leaves", "category_id": 11, "category_name": "Tea & Coffee", "unit_of_measure": "PACK", "standard_unit_price": 320.00, "is_active": "TRUE"},
        {"product_id": 10, "sku": "SKU-BEV-004", "barcode": "8901030030040", "product_name": "Nescafe Classic Instant Coffee 200g", "description": "100 percent pure robusta instant coffee jar", "category_id": 11, "category_name": "Tea & Coffee", "unit_of_measure": "JAR", "standard_unit_price": 460.00, "is_active": "TRUE"},
        {"product_id": 11, "sku": "SKU-PER-001", "barcode": "8901030040018", "product_name": "Godrej Cinthol Original Soap 125g (Pack of 3)", "description": "Deodorant and germ protection bath soap", "category_id": 4, "category_name": "Personal Care & Hygiene", "unit_of_measure": "PACK", "standard_unit_price": 140.00, "is_active": "TRUE"},
        {"product_id": 12, "sku": "SKU-PER-002", "barcode": "8901030040025", "product_name": "Godrej Protekt Germ Liquid Handwash 500ml", "description": "Neem and aloe vera hand cleanser pump", "category_id": 4, "category_name": "Personal Care & Hygiene", "unit_of_measure": "BOTTLE", "standard_unit_price": 99.00, "is_active": "TRUE"},
        {"product_id": 13, "sku": "SKU-STP-001", "barcode": "8901030050017", "product_name": "Organic Harvest Sona Masoori Rice 5kg", "description": "Aged unpolished aromatic medium grain rice", "category_id": 5, "category_name": "Staples & Grains", "unit_of_measure": "BAG", "standard_unit_price": 390.00, "is_active": "TRUE"},
        {"product_id": 14, "sku": "SKU-STP-002", "barcode": "8901030050024", "product_name": "Organic Harvest Whole Sharbati Atta 5kg", "description": "Chakki ground golden wheat flour bag", "category_id": 5, "category_name": "Staples & Grains", "unit_of_measure": "BAG", "standard_unit_price": 285.00, "is_active": "TRUE"},
        {"product_id": 15, "sku": "SKU-STP-003", "barcode": "8901030050031", "product_name": "Organic Toor Dal Unpolished 1kg", "description": "High protein premium yellow pigeon peas", "category_id": 5, "category_name": "Staples & Grains", "unit_of_measure": "PACK", "standard_unit_price": 175.00, "is_active": "TRUE"}
    ])

    # 4. Employees
    db.employees.insert_many([
        {"employee_id": 1, "full_name": "Sunil Joshi", "role": "MANAGER", "email": "sunil.joshi@smartretail.com", "phone": "+91-9844011111", "hire_date": datetime(2023, 1, 15, tzinfo=timezone.utc)},
        {"employee_id": 2, "full_name": "Divya Nair", "role": "CASHIER", "email": "divya.nair@smartretail.com", "phone": "+91-9844022222", "hire_date": datetime(2023, 6, 1, tzinfo=timezone.utc)},
        {"employee_id": 3, "full_name": "Karthik Subramanian", "role": "CASHIER", "email": "karthik.sub@smartretail.com", "phone": "+91-9844033333", "hire_date": datetime(2023, 8, 15, tzinfo=timezone.utc)},
        {"employee_id": 4, "full_name": "Amit Sen", "role": "PROCUREMENT_OFFICER", "email": "amit.sen@smartretail.com", "phone": "+91-9844044444", "hire_date": datetime(2023, 3, 10, tzinfo=timezone.utc)},
        {"employee_id": 5, "full_name": "Rajesh Goud", "role": "WAREHOUSE_STAFF", "email": "rajesh.goud@smartretail.com", "phone": "+91-9844055555", "hire_date": datetime(2023, 4, 20, tzinfo=timezone.utc)},
        {"employee_id": 6, "full_name": "Meenakshi Rao", "role": "ADMIN", "email": "meenakshi.rao@smartretail.com", "phone": "+91-9844066666", "hire_date": datetime(2022, 11, 1, tzinfo=timezone.utc)}
    ])

    # 5. Inventory Locations
    db.inventory_locations.insert_many([
        {"location_id": 1, "location_code": "WH-CENTRAL-01", "location_type": "WAREHOUSE", "location_name": "Central Ambient Warehouse Hub", "parent_location_id": None, "capacity": 50000, "aisle_number": None, "zone": "ZONE-NORTH-DRY"},
        {"location_id": 2, "location_code": "WH-COLD-01", "location_type": "WAREHOUSE", "location_name": "Central Cold Storage & Chillers", "parent_location_id": None, "capacity": 15000, "aisle_number": None, "zone": "ZONE-COLD-CHILL"},
        {"location_id": 3, "location_code": "SH-DAIRY-01", "location_type": "SHELF", "location_name": "Front Chilled Dairy Showcase", "parent_location_id": 2, "capacity": 400, "aisle_number": "Aisle-01", "zone": "STORE-FRONT-COLD"},
        {"location_id": 4, "location_code": "SH-BAKERY-01", "location_type": "SHELF", "location_name": "Fresh Bakery Island Shelf", "parent_location_id": 1, "capacity": 300, "aisle_number": "Aisle-03", "zone": "STORE-MID-BAKERY"},
        {"location_id": 5, "location_code": "SH-BEV-01", "location_type": "SHELF", "location_name": "Beverages & TetraPack Wall Shelf", "parent_location_id": 1, "capacity": 500, "aisle_number": "Aisle-02", "zone": "STORE-FRONT-BEV"},
        {"location_id": 6, "location_code": "SH-STAPLES-01", "location_type": "SHELF", "location_name": "Bulk Grains & Staples Gondola", "parent_location_id": 1, "capacity": 600, "aisle_number": "Aisle-06", "zone": "STORE-BACK-GRAINS"}
    ])

    # 6. Inventory Stock
    now = datetime.now(timezone.utc)
    db.inventory_stock.insert_many([
        {"location_id": 2, "product_id": 1, "quantity_on_hand": 180, "reorder_threshold": 50, "reorder_quantity": 100, "last_updated_at": now},
        {"location_id": 3, "product_id": 1, "quantity_on_hand": 8, "reorder_threshold": 15, "reorder_quantity": 30, "last_updated_at": now},
        {"location_id": 2, "product_id": 2, "quantity_on_hand": 35, "reorder_threshold": 10, "reorder_quantity": 25, "last_updated_at": now},
        {"location_id": 3, "product_id": 2, "quantity_on_hand": 12, "reorder_threshold": 5, "reorder_quantity": 15, "last_updated_at": now},
        {"location_id": 2, "product_id": 3, "quantity_on_hand": 18, "reorder_threshold": 5, "reorder_quantity": 15, "last_updated_at": now},
        {"location_id": 3, "product_id": 3, "quantity_on_hand": 10, "reorder_threshold": 4, "reorder_quantity": 10, "last_updated_at": now},
        {"location_id": 1, "product_id": 4, "quantity_on_hand": 120, "reorder_threshold": 30, "reorder_quantity": 80, "last_updated_at": now},
        {"location_id": 4, "product_id": 4, "quantity_on_hand": 25, "reorder_threshold": 10, "reorder_quantity": 40, "last_updated_at": now},
        {"location_id": 1, "product_id": 5, "quantity_on_hand": 60, "reorder_threshold": 20, "reorder_quantity": 50, "last_updated_at": now},
        {"location_id": 4, "product_id": 5, "quantity_on_hand": 6, "reorder_threshold": 12, "reorder_quantity": 30, "last_updated_at": now},
        {"location_id": 1, "product_id": 7, "quantity_on_hand": 75, "reorder_threshold": 25, "reorder_quantity": 50, "last_updated_at": now},
        {"location_id": 5, "product_id": 7, "quantity_on_hand": 18, "reorder_threshold": 8, "reorder_quantity": 20, "last_updated_at": now},
        {"location_id": 1, "product_id": 8, "quantity_on_hand": 40, "reorder_threshold": 20, "reorder_quantity": 40, "last_updated_at": now},
        {"location_id": 5, "product_id": 8, "quantity_on_hand": 14, "reorder_threshold": 6, "reorder_quantity": 15, "last_updated_at": now},
        {"location_id": 1, "product_id": 9, "quantity_on_hand": 25, "reorder_threshold": 30, "reorder_quantity": 40, "last_updated_at": now},
        {"location_id": 5, "product_id": 9, "quantity_on_hand": 15, "reorder_threshold": 5, "reorder_quantity": 15, "last_updated_at": now},
        {"location_id": 1, "product_id": 13, "quantity_on_hand": 50, "reorder_threshold": 15, "reorder_quantity": 30, "last_updated_at": now},
        {"location_id": 6, "product_id": 13, "quantity_on_hand": 15, "reorder_threshold": 5, "reorder_quantity": 15, "last_updated_at": now},
        {"location_id": 1, "product_id": 14, "quantity_on_hand": 45, "reorder_threshold": 15, "reorder_quantity": 30, "last_updated_at": now},
        {"location_id": 6, "product_id": 14, "quantity_on_hand": 12, "reorder_threshold": 5, "reorder_quantity": 15, "last_updated_at": now}
    ])

    # 7. Customers
    db.customers.insert_many([
        {"customer_id": 1, "first_name": "Aditya", "last_name": "Verma", "email": "aditya.verma@gmail.com", "phone_numbers": ["+91-9871122334"], "loyalty_points": 450, "membership_type": "SILVER", "registered_date": datetime(2024, 4, 12, tzinfo=timezone.utc)},
        {"customer_id": 2, "first_name": "Priya", "last_name": "Sundaram", "email": "priya.sundaram@yahoo.co.in", "phone_numbers": ["+91-9884455667", "+91-044-24991234"], "loyalty_points": 1350, "membership_type": "PLATINUM", "registered_date": datetime(2023, 9, 20, tzinfo=timezone.utc)},
        {"customer_id": 3, "first_name": "Rahul", "last_name": "Deshmukh", "email": "rahul.deshmukh@outlook.com", "phone_numbers": ["+91-9823344556"], "loyalty_points": 620, "membership_type": "GOLD", "registered_date": datetime(2024, 1, 18, tzinfo=timezone.utc)},
        {"customer_id": 4, "first_name": "Sneha", "last_name": "Kapoor", "email": "sneha.kapoor@gmail.com", "phone_numbers": ["+91-9810099887"], "loyalty_points": 85, "membership_type": "REGULAR", "registered_date": datetime(2025, 1, 5, tzinfo=timezone.utc)},
        {"customer_id": 5, "first_name": "Vikrant", "last_name": "Chauhan", "email": "vikrant.c@techcorp.in", "phone_numbers": ["+91-9988776655"], "loyalty_points": 0, "membership_type": "REGULAR", "registered_date": datetime(2025, 2, 14, tzinfo=timezone.utc)}
    ])

    # 8. Purchase Orders
    db.purchase_orders.insert_many([
        {
            "po_id": 1,
            "po_number": "PO-2026-001",
            "supplier_id": 1,
            "supplier_name": "Heritage Agro & Dairy Ltd",
            "created_by": 4,
            "order_date": datetime(2026, 2, 1, tzinfo=timezone.utc),
            "expected_delivery_date": datetime(2026, 2, 5, tzinfo=timezone.utc),
            "status": "COMPLETED",
            "total_amount": 29000.00,
            "is_auto_generated": "FALSE",
            "items": [
                {"product_id": 1, "sku": "SKU-DRY-001", "product_name": "Heritage Full Cream Milk 1L", "quantity_ordered": 300, "unit_price": 50.00, "subtotal": 15000.00},
                {"product_id": 2, "sku": "SKU-DRY-002", "product_name": "Amul Salted Butter 500g", "quantity_ordered": 40, "unit_price": 220.00, "subtotal": 8800.00},
                {"product_id": 3, "sku": "SKU-DRY-003", "product_name": "Amul Processed Cheese Blocks 400g", "quantity_ordered": 20, "unit_price": 260.00, "subtotal": 5200.00}
            ]
        },
        {
            "po_id": 2,
            "po_number": "PO-2026-002",
            "supplier_id": 2,
            "supplier_name": "Britannia Fresh Distribution",
            "created_by": 4,
            "order_date": datetime(2026, 2, 10, tzinfo=timezone.utc),
            "expected_delivery_date": datetime(2026, 2, 14, tzinfo=timezone.utc),
            "status": "PARTIALLY_RECEIVED",
            "total_amount": 13500.00,
            "is_auto_generated": "FALSE",
            "items": [
                {"product_id": 4, "sku": "SKU-BAK-001", "product_name": "Britannia Whole Wheat Bread 400g", "quantity_ordered": 150, "unit_price": 40.00, "subtotal": 6000.00},
                {"product_id": 5, "sku": "SKU-BAK-002", "product_name": "Britannia Good Day Butter Cookies 250g", "quantity_ordered": 150, "unit_price": 32.00, "subtotal": 4800.00},
                {"product_id": 6, "sku": "SKU-BAK-003", "product_name": "Bourbon Chocolate Cream Biscuits 150g", "quantity_ordered": 100, "unit_price": 27.00, "subtotal": 2700.00}
            ]
        },
        {
            "po_id": 3,
            "po_number": "PO-2026-003",
            "supplier_id": 3,
            "supplier_name": "Himalayan Pure Beverages",
            "created_by": 4,
            "order_date": datetime(2026, 2, 20, tzinfo=timezone.utc),
            "expected_delivery_date": datetime(2026, 2, 25, tzinfo=timezone.utc),
            "status": "SHIPPED",
            "total_amount": 23000.00,
            "is_auto_generated": "TRUE",
            "items": [
                {"product_id": 7, "sku": "SKU-BEV-001", "product_name": "Real Fruit Power Mixed Fruit Juice 1L", "quantity_ordered": 100, "unit_price": 95.00, "subtotal": 9500.00},
                {"product_id": 8, "sku": "SKU-BEV-002", "product_name": "Tropicana 100 Orange Juice 1L", "quantity_ordered": 100, "unit_price": 115.00, "subtotal": 11500.00},
                {"product_id": 9, "sku": "SKU-BEV-003", "product_name": "Tata Tea Gold Leaf 500g", "quantity_ordered": 20, "unit_price": 100.00, "subtotal": 2000.00}
            ]
        },
        {
            "po_id": 4,
            "po_number": "PO-2026-004",
            "supplier_id": 5,
            "supplier_name": "Organic Harvest Mills",
            "created_by": 4,
            "order_date": datetime(2026, 3, 1, tzinfo=timezone.utc),
            "expected_delivery_date": datetime(2026, 3, 7, tzinfo=timezone.utc),
            "status": "APPROVED",
            "total_amount": 44500.00,
            "is_auto_generated": "FALSE",
            "items": [
                {"product_id": 13, "sku": "SKU-STP-001", "product_name": "Organic Harvest Sona Masoori Rice 5kg", "quantity_ordered": 70, "unit_price": 320.00, "subtotal": 22400.00},
                {"product_id": 14, "sku": "SKU-STP-002", "product_name": "Organic Harvest Whole Sharbati Atta 5kg", "quantity_ordered": 60, "unit_price": 235.00, "subtotal": 14100.00},
                {"product_id": 15, "sku": "SKU-STP-003", "product_name": "Organic Toor Dal Unpolished 1kg", "quantity_ordered": 50, "unit_price": 160.00, "subtotal": 8000.00}
            ]
        }
    ])

    # 9. Shipments
    db.shipments.insert_many([
        {
            "shipment_id": 1,
            "tracking_number": "TRK-IND-902181",
            "po_id": 1,
            "carrier": "BlueDart Express",
            "shipment_date": datetime(2026, 2, 2, tzinfo=timezone.utc),
            "received_date": datetime(2026, 2, 4, tzinfo=timezone.utc),
            "status": "RECEIVED",
            "received_by": 5,
            "items": [
                {"product_id": 1, "sku": "SKU-DRY-001", "quantity_shipped": 300, "quantity_received": 300},
                {"product_id": 2, "sku": "SKU-DRY-002", "quantity_shipped": 40, "quantity_received": 40},
                {"product_id": 3, "sku": "SKU-DRY-003", "quantity_shipped": 20, "quantity_received": 20}
            ]
        },
        {
            "shipment_id": 2,
            "tracking_number": "TRK-IND-902182",
            "po_id": 2,
            "carrier": "Delhivery Logistics",
            "shipment_date": datetime(2026, 2, 11, tzinfo=timezone.utc),
            "received_date": datetime(2026, 2, 13, tzinfo=timezone.utc),
            "status": "PARTIALLY_RECEIVED",
            "received_by": 5,
            "items": [
                {"product_id": 4, "sku": "SKU-BAK-001", "quantity_shipped": 150, "quantity_received": 150},
                {"product_id": 5, "sku": "SKU-BAK-002", "quantity_shipped": 150, "quantity_received": 90},
                {"product_id": 6, "sku": "SKU-BAK-003", "quantity_shipped": 100, "quantity_received": 0}
            ]
        },
        {
            "shipment_id": 3,
            "tracking_number": "TRK-IND-902183",
            "po_id": 3,
            "carrier": "GATI KWE FastCargo",
            "shipment_date": datetime(2026, 2, 21, tzinfo=timezone.utc),
            "received_date": None,
            "status": "IN_TRANSIT",
            "received_by": None,
            "items": [
                {"product_id": 7, "sku": "SKU-BEV-001", "quantity_shipped": 100, "quantity_received": 0},
                {"product_id": 8, "sku": "SKU-BEV-002", "quantity_shipped": 100, "quantity_received": 0},
                {"product_id": 9, "sku": "SKU-BEV-003", "quantity_shipped": 20, "quantity_received": 0}
            ]
        }
    ])

    # 10. Sales Transactions
    db.sales_transactions.insert_many([
        {
            "transaction_id": 1,
            "receipt_number": "RCP-2026-0001",
            "customer_id": 1,
            "customer_name": "Aditya Verma",
            "cashier_id": 2,
            "transaction_date": datetime(2026, 2, 15, 10, 30, tzinfo=timezone.utc),
            "total_amount": 403.00,
            "status": "COMPLETED",
            "items": [
                {"product_id": 1, "sku": "SKU-DRY-001", "product_name": "Heritage Full Cream Milk 1L", "shelf_location_id": 3, "shelf_code": "SH-DAIRY-01", "quantity_sold": 2, "unit_price": 64.00, "subtotal": 128.00},
                {"product_id": 2, "sku": "SKU-DRY-002", "product_name": "Amul Salted Butter 500g", "shelf_location_id": 3, "shelf_code": "SH-DAIRY-01", "quantity_sold": 1, "unit_price": 275.00, "subtotal": 275.00}
            ],
            "payments": [
                {"payment_id": 1, "payment_method": "UPI", "amount": 403.00, "payment_date": datetime(2026, 2, 15, 10, 32, tzinfo=timezone.utc), "reference_number": "UPI-REF-99882211", "status": "SUCCESS"}
            ]
        },
        {
            "transaction_id": 2,
            "receipt_number": "RCP-2026-0002",
            "customer_id": None,
            "customer_name": "Guest Walk-In",
            "cashier_id": 3,
            "transaction_date": datetime(2026, 2, 15, 11, 45, tzinfo=timezone.utc),
            "total_amount": 165.00,
            "status": "COMPLETED",
            "items": [
                {"product_id": 4, "sku": "SKU-BAK-001", "product_name": "Britannia Whole Wheat Bread 400g", "shelf_location_id": 4, "shelf_code": "SH-BAKERY-01", "quantity_sold": 1, "unit_price": 50.00, "subtotal": 50.00},
                {"product_id": 5, "sku": "SKU-BAK-002", "product_name": "Britannia Good Day Butter Cookies 250g", "shelf_location_id": 4, "shelf_code": "SH-BAKERY-01", "quantity_sold": 1, "unit_price": 45.00, "subtotal": 45.00},
                {"product_id": 6, "sku": "SKU-BAK-003", "product_name": "Bourbon Chocolate Cream Biscuits 150g", "shelf_location_id": 4, "shelf_code": "SH-BAKERY-01", "quantity_sold": 2, "unit_price": 35.00, "subtotal": 70.00}
            ],
            "payments": [
                {"payment_id": 2, "payment_method": "CASH", "amount": 165.00, "payment_date": datetime(2026, 2, 15, 11, 46, tzinfo=timezone.utc), "reference_number": None, "status": "SUCCESS"}
            ]
        },
        {
            "transaction_id": 3,
            "receipt_number": "RCP-2026-0003",
            "customer_id": 2,
            "customer_name": "Priya Sundaram",
            "cashier_id": 2,
            "transaction_date": datetime(2026, 2, 16, 14, 15, tzinfo=timezone.utc),
            "total_amount": 1140.00,
            "status": "COMPLETED",
            "items": [
                {"product_id": 7, "sku": "SKU-BEV-001", "product_name": "Real Fruit Power Mixed Fruit Juice 1L", "shelf_location_id": 5, "shelf_code": "SH-BEV-01", "quantity_sold": 2, "unit_price": 120.00, "subtotal": 240.00},
                {"product_id": 9, "sku": "SKU-BEV-003", "product_name": "Tata Tea Gold Leaf 500g", "shelf_location_id": 5, "shelf_code": "SH-BEV-01", "quantity_sold": 1, "unit_price": 320.00, "subtotal": 320.00},
                {"product_id": 13, "sku": "SKU-STP-001", "product_name": "Organic Harvest Sona Masoori Rice 5kg", "shelf_location_id": 6, "shelf_code": "SH-STAPLES-01", "quantity_sold": 1, "unit_price": 390.00, "subtotal": 390.00},
                {"product_id": 8, "sku": "SKU-BEV-002", "product_name": "Tropicana 100 Orange Juice 1L", "shelf_location_id": 5, "shelf_code": "SH-BEV-01", "quantity_sold": 1, "unit_price": 190.00, "subtotal": 190.00}
            ],
            "payments": [
                {"payment_id": 3, "payment_method": "CREDIT_CARD", "amount": 700.00, "payment_date": datetime(2026, 2, 16, 14, 16, tzinfo=timezone.utc), "reference_number": "TXN-HDFC-991201", "status": "SUCCESS"},
                {"payment_id": 4, "payment_method": "WALLET", "amount": 440.00, "payment_date": datetime(2026, 2, 16, 14, 17, tzinfo=timezone.utc), "reference_number": "PAYTM-WLT-554433", "status": "SUCCESS"}
            ]
        }
    ])

    # 11. Payments (Financial Ledger)
    db.payments.insert_many([
        {"payment_id": 1, "transaction_id": 1, "receipt_number": "RCP-2026-0001", "payment_method": "UPI", "amount": 403.00, "payment_date": datetime(2026, 2, 15, 10, 32, tzinfo=timezone.utc), "reference_number": "UPI-REF-99882211", "status": "SUCCESS"},
        {"payment_id": 2, "transaction_id": 2, "receipt_number": "RCP-2026-0002", "payment_method": "CASH", "amount": 165.00, "payment_date": datetime(2026, 2, 15, 11, 46, tzinfo=timezone.utc), "reference_number": None, "status": "SUCCESS"},
        {"payment_id": 3, "transaction_id": 3, "receipt_number": "RCP-2026-0003", "payment_method": "CREDIT_CARD", "amount": 700.00, "payment_date": datetime(2026, 2, 16, 14, 16, tzinfo=timezone.utc), "reference_number": "TXN-HDFC-991201", "status": "SUCCESS"},
        {"payment_id": 4, "transaction_id": 3, "receipt_number": "RCP-2026-0003", "payment_method": "WALLET", "amount": 440.00, "payment_date": datetime(2026, 2, 16, 14, 17, tzinfo=timezone.utc), "reference_number": "PAYTM-WLT-554433", "status": "SUCCESS"}
    ])

    # 12. Inventory Transactions
    db.inventory_transactions.insert_many([
        {"transaction_id": 1, "product_id": 1, "location_id": 2, "transaction_type": "RECEIPT", "quantity": 300, "transaction_date": datetime(2026, 2, 4, 11, 0, tzinfo=timezone.utc), "reference_type": "SHIPMENT", "reference_id": 1},
        {"transaction_id": 2, "product_id": 2, "location_id": 2, "transaction_type": "RECEIPT", "quantity": 40, "transaction_date": datetime(2026, 2, 4, 11, 5, tzinfo=timezone.utc), "reference_type": "SHIPMENT", "reference_id": 1},
        {"transaction_id": 3, "product_id": 3, "location_id": 2, "transaction_type": "RECEIPT", "quantity": 20, "transaction_date": datetime(2026, 2, 4, 11, 10, tzinfo=timezone.utc), "reference_type": "SHIPMENT", "reference_id": 1},
        {"transaction_id": 4, "product_id": 1, "location_id": 2, "transaction_type": "TRANSFER_OUT", "quantity": -50, "transaction_date": datetime(2026, 2, 6, 8, 30, tzinfo=timezone.utc), "reference_type": "RESTOCK", "reference_id": 1},
        {"transaction_id": 5, "product_id": 1, "location_id": 3, "transaction_type": "TRANSFER_IN", "quantity": 50, "transaction_date": datetime(2026, 2, 6, 8, 35, tzinfo=timezone.utc), "reference_type": "RESTOCK", "reference_id": 1},
        {"transaction_id": 6, "product_id": 1, "location_id": 3, "transaction_type": "SALE", "quantity": -2, "transaction_date": datetime(2026, 2, 15, 10, 30, tzinfo=timezone.utc), "reference_type": "SALE", "reference_id": 1},
        {"transaction_id": 7, "product_id": 2, "location_id": 3, "transaction_type": "SALE", "quantity": -1, "transaction_date": datetime(2026, 2, 15, 10, 30, tzinfo=timezone.utc), "reference_type": "SALE", "reference_id": 1}
    ])

    # 13. Restock Events
    db.restock_events.insert_many([
        {"restock_id": 1, "product_id": 1, "product_name": "Heritage Full Cream Milk 1L", "from_location_id": 2, "to_location_id": 3, "quantity_moved": 50, "event_date": datetime(2026, 2, 6, 8, 30, tzinfo=timezone.utc), "triggered_by": "AUTO_THRESHOLD", "performed_by": 5, "status": "COMPLETED"},
        {"restock_id": 2, "product_id": 4, "product_name": "Britannia Whole Wheat Bread 400g", "from_location_id": 1, "to_location_id": 4, "quantity_moved": 40, "event_date": datetime(2026, 2, 10, 9, 0, tzinfo=timezone.utc), "triggered_by": "MANUAL_REQUEST", "performed_by": 5, "status": "COMPLETED"},
        {"restock_id": 3, "product_id": 5, "product_name": "Britannia Good Day Butter Cookies 250g", "from_location_id": 1, "to_location_id": 4, "quantity_moved": 30, "event_date": datetime(2026, 2, 16, 16, 0, tzinfo=timezone.utc), "triggered_by": "AUTO_THRESHOLD", "performed_by": None, "status": "PENDING"}
    ])

    # 14. Reorder Triggers
    db.reorder_triggers.insert_many([
        {"trigger_id": 1, "product_id": 7, "product_name": "Real Fruit Power Mixed Fruit Juice 1L", "location_id": 1, "stock_at_trigger": 20, "threshold_at_trigger": 25, "trigger_date": datetime(2026, 2, 18, 10, 0, tzinfo=timezone.utc), "generated_po_id": 3, "status": "PO_CREATED"},
        {"trigger_id": 2, "product_id": 9, "product_name": "Tata Tea Gold Leaf 500g", "location_id": 1, "stock_at_trigger": 25, "threshold_at_trigger": 30, "trigger_date": datetime(2026, 2, 28, 17, 30, tzinfo=timezone.utc), "generated_po_id": None, "status": "OPEN"}
    ])

    print("=========================================================================")
    print(f"Seed data successfully populated via PyMongo in database: {db_name}")
    for coll in collections:
        print(f" - {coll}: {db[coll].count_documents({})} documents")
    print("=========================================================================")


if __name__ == "__main__":
    seed_database()
