"""
SmartRetail DA3 — Aggregation Pipeline Tests
Module: da3_mongodb/tests/test_aggregations.py
"""

import pytest


def test_revenue_by_category_aggregation(test_db):
    """Test 16: Verify revenue by category aggregation matches sales total."""
    pipeline = [
        {"$match": {"status": "COMPLETED"}},
        {"$unwind": "$items"},
        {
            "$lookup": {
                "from": "products",
                "localField": "items.product_id",
                "foreignField": "product_id",
                "as": "prod"
            }
        },
        {"$unwind": "$prod"},
        {
            "$group": {
                "_id": "$prod.category_name",
                "total_rev": {"$sum": "$items.subtotal"}
            }
        }
    ]
    results = list(test_db.sales_transactions.aggregate(pipeline))
    assert len(results) > 0
    total_rev = sum(r["total_rev"] for r in results)
    # Seed data has 3 sales: 403.00 + 165.00 + 1140.00 = 1708.00
    assert total_rev == 1708.00


def test_receipt_lookup_join(test_db):
    """Test 17: Multi-collection $lookup join reconstructing POS receipt."""
    pipeline = [
        {"$match": {"receipt_number": "RCP-2026-0001"}},
        {
            "$lookup": {
                "from": "customers",
                "localField": "customer_id",
                "foreignField": "customer_id",
                "as": "customer"
            }
        },
        {
            "$lookup": {
                "from": "employees",
                "localField": "cashier_id",
                "foreignField": "employee_id",
                "as": "cashier"
            }
        }
    ]
    reconstructed = list(test_db.sales_transactions.aggregate(pipeline))
    assert len(reconstructed) == 1
    receipt = reconstructed[0]
    assert receipt["customer"][0]["first_name"] == "Aditya"
    assert receipt["cashier"][0]["full_name"] == "Divya Nair"
    assert len(receipt["items"]) == 2
    assert len(receipt["payments"]) == 1


def test_enterprise_stock_valuation(test_db):
    """Test 18: Total inventory valuation across all locations."""
    pipeline = [
        {
            "$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "product_id",
                "as": "prod"
            }
        },
        {"$unwind": "$prod"},
        {
            "$group": {
                "_id": None,
                "total_val": {"$sum": {"$multiply": ["$quantity_on_hand", "$prod.standard_unit_price"]}},
                "total_units": {"$sum": "$quantity_on_hand"}
            }
        }
    ]
    res = list(test_db.inventory_stock.aggregate(pipeline))
    assert len(res) == 1
    assert res[0]["total_units"] == 783
    assert res[0]["total_val"] == 117242.00
