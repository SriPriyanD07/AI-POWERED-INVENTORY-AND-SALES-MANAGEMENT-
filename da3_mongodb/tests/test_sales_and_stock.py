"""
SmartRetail DA3 — Sales & Stock Tests
Module: da3_mongodb/tests/test_sales_and_stock.py
"""

import pytest
from datetime import datetime


def test_inventory_decrement_after_sale(test_db, sales_service):
    """Test 5: Verify shelf stock decrements accurately upon sale."""
    # Product 1 at Shelf 3 initially has QOH = 8
    initial_stk = test_db.inventory_stock.find_one({"location_id": 3, "product_id": 1})
    initial_qoh = initial_stk["quantity_on_hand"]

    receipt = f"RCP-TEST-DEC-{int(datetime.now().timestamp())}"
    res = sales_service.process_sale(
        receipt_number=receipt,
        cashier_id=2,
        customer_id=1,
        items=[{"product_id": 1, "shelf_location_id": 3, "quantity": 2, "unit_price": 64.00}],
        payments=[{"payment_method": "UPI", "amount": 128.00}]
    )
    assert res["success"] is True

    updated_stk = test_db.inventory_stock.find_one({"location_id": 3, "product_id": 1})
    assert updated_stk["quantity_on_hand"] == initial_qoh - 2

    # Verify audit transaction created
    audit_row = test_db.inventory_transactions.find_one({
        "reference_id": res["transaction_id"],
        "transaction_type": "SALE"
    })
    assert audit_row is not None
    assert audit_row["quantity"] == -2


def test_rejection_of_sale_exceeding_stock(test_db, sales_service):
    """Test 6: Verify sale is rejected when requested quantity exceeds available stock."""
    # Product 1 at Shelf 3 has 8 units available; attempt to sell 999 units
    receipt = f"RCP-TEST-OVERDRAFT-{int(datetime.now().timestamp())}"
    with pytest.raises(ValueError, match="Insufficient shelf stock"):
        sales_service.process_sale(
            receipt_number=receipt,
            cashier_id=2,
            customer_id=1,
            items=[{"product_id": 1, "shelf_location_id": 3, "quantity": 999, "unit_price": 64.00}],
            payments=[{"payment_method": "CASH", "amount": 999 * 64.00}]
        )

    # Stock must remain unaffected
    stk = test_db.inventory_stock.find_one({"location_id": 3, "product_id": 1})
    assert stk["quantity_on_hand"] == 8


def test_payment_split_and_association(test_db, sales_service):
    """Test 7: Verify split payment tender settlement and projection into payments collection."""
    receipt = f"RCP-TEST-SPLIT-{int(datetime.now().timestamp())}"
    # Bread: 2 @ 50 = 100. Split: 60 Cash + 40 UPI
    res = sales_service.process_sale(
        receipt_number=receipt,
        cashier_id=2,
        customer_id=2,
        items=[{"product_id": 4, "shelf_location_id": 4, "quantity": 2, "unit_price": 50.00}],
        payments=[
            {"payment_method": "CASH", "amount": 60.00},
            {"payment_method": "UPI", "amount": 40.00, "reference_number": "UPI-SPLIT-99"}
        ]
    )
    assert res["success"] is True
    assert res["total_amount"] == 100.00

    # Verify payments recorded in dedicated payments collection
    payments_in_db = list(test_db.payments.find({"transaction_id": res["transaction_id"]}))
    assert len(payments_in_db) == 2
    tender_sum = sum(p["amount"] for p in payments_in_db)
    assert tender_sum == 100.00


def test_duplicate_receipt_rejection(test_db, sales_service):
    """Test 8: Verify duplicate receipt number is rejected safely."""
    receipt = f"RCP-TEST-DUP-{int(datetime.now().timestamp())}"
    sales_service.process_sale(
        receipt_number=receipt,
        cashier_id=2,
        customer_id=1,
        items=[{"product_id": 1, "shelf_location_id": 3, "quantity": 1, "unit_price": 64.00}],
        payments=[{"payment_method": "UPI", "amount": 64.00}]
    )

    # Second sale with identical receipt must fail
    with pytest.raises(ValueError, match="Duplicate Sale"):
        sales_service.process_sale(
            receipt_number=receipt,
            cashier_id=2,
            customer_id=1,
            items=[{"product_id": 1, "shelf_location_id": 3, "quantity": 1, "unit_price": 64.00}],
            payments=[{"payment_method": "UPI", "amount": 64.00}]
        )


def test_referential_consistency_checks(test_db, sales_service):
    """Test 9: Verify sales are rejected for inactive products or non-shelf locations."""
    # 1. Non-shelf location rejection (Location 1 is WAREHOUSE)
    with pytest.raises(ValueError, match="not a retail SHELF"):
        sales_service.process_sale(
            receipt_number="RCP-BAD-LOC",
            cashier_id=2,
            items=[{"product_id": 4, "shelf_location_id": 1, "quantity": 1}],
            payments=[{"payment_method": "CASH", "amount": 50.00}]
        )

    # 2. Inactive product rejection
    test_db.products.update_one({"product_id": 2}, {"$set": {"is_active": "FALSE"}})
    with pytest.raises(ValueError, match="discontinued/inactive"):
        sales_service.process_sale(
            receipt_number="RCP-INACTIVE",
            cashier_id=2,
            items=[{"product_id": 2, "shelf_location_id": 3, "quantity": 1}],
            payments=[{"payment_method": "CASH", "amount": 275.00}]
        )
