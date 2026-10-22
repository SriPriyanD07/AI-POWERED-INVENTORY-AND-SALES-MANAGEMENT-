"""
SmartRetail DA3 — Validators & Index Tests
Module: da3_mongodb/tests/test_validators_indexes.py
"""

import pytest
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError, WriteError


def test_successful_insertion_and_retrieval(test_db):
    """Test 1: Verify valid document insertion and retrieval."""
    new_customer = {
        "customer_id": 999,
        "first_name": "Dev",
        "last_name": "Kumar",
        "email": "dev.kumar@testretail.com",
        "phone_numbers": ["+91-9999988888"],
        "loyalty_points": 50,
        "membership_type": "REGULAR",
        "registered_date": datetime.now(timezone.utc)
    }
    insert_res = test_db.customers.insert_one(new_customer)
    assert insert_res.inserted_id is not None

    retrieved = test_db.customers.find_one({"customer_id": 999})
    assert retrieved is not None
    assert retrieved["email"] == "dev.kumar@testretail.com"
    assert retrieved["phone_numbers"] == ["+91-9999988888"]


def test_product_updates(test_db):
    """Test 2: Verify updating product attributes."""
    update_res = test_db.products.update_one(
        {"product_id": 1},
        {"$set": {"standard_unit_price": 68.50, "description": "Updated pasteurized pouch"}}
    )
    assert update_res.matched_count == 1
    assert update_res.modified_count == 1

    prod = test_db.products.find_one({"product_id": 1})
    assert prod["standard_unit_price"] == 68.50


def test_unique_index_enforcement(test_db):
    """Test 3: Verify unique index prevents duplicate business keys."""
    # Attempt duplicate customer email
    with pytest.raises(DuplicateKeyError):
        test_db.customers.insert_one({
            "customer_id": 998,
            "first_name": "Duplicate",
            "last_name": "User",
            "email": "aditya.verma@gmail.com",  # Already exists for customer 1
            "phone_numbers": ["+91-9999900000"],
            "loyalty_points": 0,
            "membership_type": "REGULAR",
            "registered_date": datetime.now(timezone.utc)
        })

    # Attempt duplicate product SKU
    with pytest.raises(DuplicateKeyError):
        test_db.products.insert_one({
            "product_id": 997,
            "sku": "SKU-DRY-001",  # Already exists for product 1
            "barcode": "8901030099999",
            "product_name": "Duplicate SKU Product",
            "category_id": 6,
            "unit_of_measure": "PACK",
            "standard_unit_price": 50.00,
            "is_active": "TRUE"
        })

    # Attempt duplicate compound index on inventory_stock (location_id, product_id)
    with pytest.raises(DuplicateKeyError):
        test_db.inventory_stock.insert_one({
            "location_id": 3,
            "product_id": 1,  # Pair (3, 1) already exists in seed data
            "quantity_on_hand": 20,
            "reorder_threshold": 10,
            "reorder_quantity": 25,
            "last_updated_at": datetime.now(timezone.utc)
        })


def test_schema_validation_rejection(test_db):
    """Test 4: Verify MongoDB JSON Schema validator rejects invalid records."""
    # 1. Invalid email format in customer
    with pytest.raises(WriteError):
        test_db.customers.insert_one({
            "customer_id": 888,
            "first_name": "Invalid",
            "last_name": "Email",
            "email": "not-an-email",
            "phone_numbers": [],
            "loyalty_points": 10,
            "membership_type": "REGULAR"
        })

    # 2. Invalid price (must be positive > 0.01) in product
    with pytest.raises(WriteError):
        test_db.products.insert_one({
            "product_id": 887,
            "sku": "SKU-TEST-NEG",
            "barcode": "8909999999999",
            "product_name": "Negative Price Product",
            "category_id": 1,
            "unit_of_measure": "PACK",
            "standard_unit_price": -15.00,
            "is_active": "TRUE"
        })

    # 3. Invalid employee role
    with pytest.raises(WriteError):
        test_db.employees.insert_one({
            "employee_id": 886,
            "full_name": "Invalid Role Staff",
            "role": "CEO_FOUNDER",  # Not in allowed role enum
            "email": "ceo@smartretail.com",
            "hire_date": datetime.now(timezone.utc)
        })
