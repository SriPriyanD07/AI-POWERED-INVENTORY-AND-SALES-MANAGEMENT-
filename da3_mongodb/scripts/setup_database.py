"""
SmartRetail DA3 — Python Database Setup & Index/Validator Initialization
Script: da3_mongodb/scripts/setup_database.py
"""

import os
import re
from pathlib import Path
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


def get_masked_uri(uri: str) -> str:
    """Mask password in MongoDB URI for safe logging."""
    if not uri:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", uri)


VALIDATORS = {
    "customers": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["customer_id", "first_name", "last_name", "email", "loyalty_points"],
            "properties": {
                "customer_id": {"bsonType": "int"},
                "first_name": {"bsonType": "string"},
                "last_name": {"bsonType": "string"},
                "email": {
                    "bsonType": "string",
                    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                },
                "loyalty_points": {"bsonType": "int", "minimum": 0},
                "membership_type": {"enum": ["REGULAR", "SILVER", "GOLD", "PLATINUM", None]}
            }
        }
    },
    "employees": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["employee_id", "full_name", "role", "email"],
            "properties": {
                "employee_id": {"bsonType": "int"},
                "full_name": {"bsonType": "string"},
                "role": {"enum": ["CASHIER", "MANAGER", "PROCUREMENT_OFFICER", "WAREHOUSE_STAFF", "ADMIN"]},
                "email": {"bsonType": "string"}
            }
        }
    },
    "products": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["product_id", "sku", "barcode", "product_name", "category_id", "unit_of_measure", "standard_unit_price", "is_active"],
            "properties": {
                "product_id": {"bsonType": "int"},
                "sku": {"bsonType": "string"},
                "barcode": {"bsonType": "string"},
                "product_name": {"bsonType": "string"},
                "category_id": {"bsonType": "int"},
                "unit_of_measure": {"bsonType": "string"},
                "standard_unit_price": {"bsonType": ["double", "int", "decimal"], "minimum": 0.01},
                "is_active": {"enum": ["TRUE", "FALSE", True, False]}
            }
        }
    },
    "inventory_stock": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["location_id", "product_id", "quantity_on_hand", "reorder_threshold", "reorder_quantity"],
            "properties": {
                "location_id": {"bsonType": "int"},
                "product_id": {"bsonType": "int"},
                "quantity_on_hand": {"bsonType": "int", "minimum": 0},
                "reorder_threshold": {"bsonType": "int", "minimum": 0},
                "reorder_quantity": {"bsonType": "int", "minimum": 1}
            }
        }
    },
    "sales_transactions": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["transaction_id", "receipt_number", "cashier_id", "total_amount", "status", "items"],
            "properties": {
                "transaction_id": {"bsonType": "int"},
                "receipt_number": {"bsonType": "string"},
                "cashier_id": {"bsonType": "int"},
                "total_amount": {"bsonType": ["double", "int", "decimal"], "minimum": 0},
                "status": {"enum": ["COMPLETED", "VOID", "REFUNDED"]},
                "items": {"bsonType": "array", "minItems": 1},
                "payments": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["payment_id", "payment_method", "amount", "status"],
                        "properties": {
                            "payment_id": {"bsonType": "int"},
                            "payment_method": {"enum": ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "WALLET", "POINTS"]},
                            "amount": {"bsonType": ["double", "int", "decimal"], "minimum": 0.01},
                            "status": {"enum": ["SUCCESS", "PENDING", "FAILED", "REFUNDED"]}
                        }
                    }
                }
            }
        }
    }
}


def apply_validators(db):
    existing = db.list_collection_names()
    for coll_name, validator in VALIDATORS.items():
        if coll_name in existing:
            try:
                db.command({
                    "collMod": coll_name,
                    "validator": validator,
                    "validationLevel": "strict",
                    "validationAction": "error"
                })
            except Exception:
                pass
        else:
            try:
                db.create_collection(
                    coll_name,
                    validator=validator,
                    validationLevel="strict",
                    validationAction="error"
                )
            except Exception:
                pass


def setup_database(db_name: str = DATABASE_NAME):
    print(f"Connecting to MongoDB at {get_masked_uri(MONGODB_URI)}...")
    client = MongoClient(MONGODB_URI)
    db = client[db_name]

    print(f"Applying Schema Validators for: {db_name}")
    apply_validators(db)

    print(f"Applying Indexes for: {db_name}")

    # 1. Customers
    db.customers.create_index([("customer_id", ASCENDING)], unique=True, name="uk_customer_id")
    db.customers.create_index([("email", ASCENDING)], unique=True, name="uk_customer_email")
    db.customers.create_index([("membership_type", ASCENDING)], name="idx_customer_membership")

    # 2. Employees
    db.employees.create_index([("employee_id", ASCENDING)], unique=True, name="uk_employee_id")
    db.employees.create_index([("email", ASCENDING)], unique=True, name="uk_employee_email")
    db.employees.create_index([("role", ASCENDING)], name="idx_employee_role")

    # 3. Product Categories
    db.product_categories.create_index([("category_id", ASCENDING)], unique=True, name="uk_category_id")
    db.product_categories.create_index([("category_name", ASCENDING)], unique=True, name="uk_category_name")
    db.product_categories.create_index([("parent_category_id", ASCENDING)], name="idx_cat_parent")

    # 4. Products
    db.products.create_index([("product_id", ASCENDING)], unique=True, name="uk_product_id")
    db.products.create_index([("sku", ASCENDING)], unique=True, name="uk_product_sku")
    db.products.create_index([("barcode", ASCENDING)], unique=True, name="uk_product_barcode")
    db.products.create_index([("category_id", ASCENDING)], name="idx_product_category")

    # 5. Suppliers
    db.suppliers.create_index([("supplier_id", ASCENDING)], unique=True, name="uk_supplier_id")
    db.suppliers.create_index([("email", ASCENDING)], unique=True, name="uk_supplier_email")
    db.suppliers.create_index([("gst_number", ASCENDING)], unique=True, name="uk_supplier_gst")

    # 6. Inventory Locations
    db.inventory_locations.create_index([("location_id", ASCENDING)], unique=True, name="uk_location_id")
    db.inventory_locations.create_index([("location_code", ASCENDING)], unique=True, name="uk_location_code")
    db.inventory_locations.create_index([("location_type", ASCENDING)], name="idx_loc_type")

    # 7. Inventory Stock (Compound Unique)
    db.inventory_stock.create_index([("location_id", ASCENDING), ("product_id", ASCENDING)], unique=True, name="uk_stock_loc_prod")
    db.inventory_stock.create_index([("product_id", ASCENDING)], name="idx_stock_product")
    db.inventory_stock.create_index([("quantity_on_hand", ASCENDING)], name="idx_stock_qoh")

    # 8. Inventory Transactions
    db.inventory_transactions.create_index([("transaction_id", ASCENDING)], unique=True, name="uk_inv_txn_id")
    db.inventory_transactions.create_index([("product_id", ASCENDING), ("transaction_date", DESCENDING)], name="idx_itxn_prod_date")
    db.inventory_transactions.create_index([("reference_type", ASCENDING), ("reference_id", ASCENDING)], name="idx_itxn_reference")

    # 9. Purchase Orders
    db.purchase_orders.create_index([("po_id", ASCENDING)], unique=True, name="uk_po_id")
    db.purchase_orders.create_index([("po_number", ASCENDING)], unique=True, name="uk_po_number")
    db.purchase_orders.create_index([("supplier_id", ASCENDING)], name="idx_po_supplier")
    db.purchase_orders.create_index([("status", ASCENDING)], name="idx_po_status")

    # 10. Shipments
    db.shipments.create_index([("shipment_id", ASCENDING)], unique=True, name="uk_shipment_id")
    db.shipments.create_index([("tracking_number", ASCENDING)], unique=True, name="uk_shipment_tracking")
    db.shipments.create_index([("po_id", ASCENDING)], name="idx_shipment_po")

    # 11. Sales Transactions
    db.sales_transactions.create_index([("transaction_id", ASCENDING)], unique=True, name="uk_sales_txn_id")
    db.sales_transactions.create_index([("receipt_number", ASCENDING)], unique=True, name="uk_sales_receipt")
    db.sales_transactions.create_index([("customer_id", ASCENDING)], name="idx_sales_customer")
    db.sales_transactions.create_index([("transaction_date", DESCENDING)], name="idx_sales_date")

    # 12. Payments
    db.payments.create_index([("payment_id", ASCENDING)], unique=True, name="uk_payment_id")
    db.payments.create_index([("transaction_id", ASCENDING)], name="idx_payment_txn")
    db.payments.create_index([("payment_method", ASCENDING)], name="idx_payment_method")

    # 13. Restock Events
    db.restock_events.create_index([("restock_id", ASCENDING)], unique=True, name="uk_restock_id")
    db.restock_events.create_index([("product_id", ASCENDING)], name="idx_restock_product")

    # 14. Reorder Triggers
    db.reorder_triggers.create_index([("trigger_id", ASCENDING)], unique=True, name="uk_trigger_id")
    db.reorder_triggers.create_index([("product_id", ASCENDING), ("location_id", ASCENDING)], name="idx_trigger_prod_loc")

    print(f"Setup complete. Collections initialized: {db.list_collection_names()}")
    return client, db


if __name__ == "__main__":
    setup_database()
