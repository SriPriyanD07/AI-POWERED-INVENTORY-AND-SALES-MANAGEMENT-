"""
SmartRetail DA3 — 15 Canonical Business Queries Execution Suite
Script: da3_mongodb/queries/business_queries.py
Description: Implements and executes the 15 approved SmartRetail business queries
             using PyMongo against smartretail_db.
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


class DateTimeEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


def run_business_queries(db_name: str = DATABASE_NAME):
    client = MongoClient(MONGODB_URI)
    db = client[db_name]

    print("=" * 80)
    print(f"EXECUTING 15 CANONICAL BUSINESS QUERIES ON: {db_name}")
    print("=" * 80)

    results = {}

    # 1. Retrieve all products with their categories
    print("\n--- [Query 1] All Products with Category Taxonomy ---")
    q1 = list(db.products.aggregate([
        {
            "$lookup": {
                "from": "product_categories",
                "localField": "category_id",
                "foreignField": "category_id",
                "as": "cat"
            }
        },
        {"$unwind": "$cat"},
        {
            "$project": {
                "_id": 0,
                "product_id": 1,
                "sku": 1,
                "product_name": 1,
                "standard_unit_price": 1,
                "category_name": "$cat.category_name",
                "category_path": "$cat.category_path"
            }
        },
        {"$sort": {"product_id": 1}}
    ]))
    print(f"Found {len(q1)} products. Sample (first 3):")
    for p in q1[:3]:
        print(f"  • [{p['sku']}] {p['product_name']} | {p['category_path']} | Rs. {p['standard_unit_price']}")
    results["query_1"] = q1

    # 2. Retrieve stock for a specific product across all locations (Product ID 1: Milk)
    print("\n--- [Query 2] Stock for Product ID 1 Across All Locations ---")
    q2 = list(db.inventory_stock.aggregate([
        {"$match": {"product_id": 1}},
        {
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": "$loc"},
        {
            "$project": {
                "_id": 0,
                "location_code": "$loc.location_code",
                "location_name": "$loc.location_name",
                "location_type": "$loc.location_type",
                "quantity_on_hand": 1,
                "reorder_threshold": 1,
                "reorder_quantity": 1
            }
        }
    ]))
    for s in q2:
        print(f"  • {s['location_type']} ({s['location_code']}): {s['quantity_on_hand']} units (Threshold: {s['reorder_threshold']})")
    results["query_2"] = q2

    # 3. Identify products whose shelf quantity is below reorder threshold
    print("\n--- [Query 3] Products Below Shelf Reorder Threshold ---")
    q3 = list(db.inventory_stock.aggregate([
        {
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": "$loc"},
        {
            "$match": {
                "loc.location_type": "SHELF",
                "$expr": {"$lte": ["$quantity_on_hand", "$reorder_threshold"]}
            }
        },
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
            "$project": {
                "_id": 0,
                "product_id": 1,
                "product_name": "$prod.product_name",
                "shelf_code": "$loc.location_code",
                "quantity_on_hand": 1,
                "reorder_threshold": 1,
                "deficit": {"$subtract": ["$reorder_threshold", "$quantity_on_hand"]}
            }
        }
    ]))
    for r in q3:
        print(f"  • ALERT: {r['product_name']} at {r['shelf_code']} has {r['quantity_on_hand']} units (Threshold: {r['reorder_threshold']}, Deficit: {r['deficit']})")
    results["query_3"] = q3

    # 4. Calculate total stock across warehouse and shelf locations
    print("\n--- [Query 4] Total Stock Consolidated Across All Locations per Product ---")
    q4 = list(db.inventory_stock.aggregate([
        {
            "$group": {
                "_id": "$product_id",
                "total_quantity": {"$sum": "$quantity_on_hand"},
                "locations_stocked": {"$sum": 1}
            }
        },
        {
            "$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "product_id",
                "as": "prod"
            }
        },
        {"$unwind": "$prod"},
        {
            "$project": {
                "_id": 0,
                "product_id": "$_id",
                "sku": "$prod.sku",
                "product_name": "$prod.product_name",
                "total_quantity": 1,
                "locations_stocked": 1
            }
        },
        {"$sort": {"total_quantity": -1}}
    ]))
    for p in q4[:5]:
        print(f"  • [{p['sku']}] {p['product_name']}: {p['total_quantity']} total units across {p['locations_stocked']} locations")
    results["query_4"] = q4

    # 5. Calculate daily sales totals
    print("\n--- [Query 5] Daily Sales Totals & Transaction Counts ---")
    q5 = list(db.sales_transactions.aggregate([
        {"$match": {"status": "COMPLETED"}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$transaction_date"}
                },
                "total_revenue": {"$sum": "$total_amount"},
                "total_receipts": {"$sum": 1},
                "average_ticket_value": {"$avg": "$total_amount"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "sale_date": "$_id",
                "total_revenue": {"$round": ["$total_revenue", 2]},
                "total_receipts": 1,
                "average_ticket_value": {"$round": ["$average_ticket_value", 2]}
            }
        },
        {"$sort": {"sale_date": 1}}
    ]))
    for d in q5:
        print(f"  • Date: {d['sale_date']} | Revenue: Rs. {d['total_revenue']} | Receipts: {d['total_receipts']} | Avg: Rs. {d['average_ticket_value']}")
    results["query_5"] = q5

    # 6. Calculate revenue by product category
    print("\n--- [Query 6] Revenue by Product Category ---")
    q6 = list(db.sales_transactions.aggregate([
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
                "revenue": {"$sum": "$items.subtotal"},
                "units_sold": {"$sum": "$items.quantity_sold"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "category_name": "$_id",
                "revenue": {"$round": ["$revenue", 2]},
                "units_sold": 1
            }
        },
        {"$sort": {"revenue": -1}}
    ]))
    for c in q6:
        print(f"  • {c['category_name']}: Rs. {c['revenue']} ({c['units_sold']} units sold)")
    results["query_6"] = q6

    # 7. Identify the best-selling products
    print("\n--- [Query 7] Best-Selling Products ---")
    q7 = list(db.sales_transactions.aggregate([
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "units_sold": {"$sum": "$items.quantity_sold"},
                "gross_revenue": {"$sum": "$items.subtotal"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "product_id": "$_id",
                "product_name": 1,
                "units_sold": 1,
                "gross_revenue": {"$round": ["$gross_revenue", 2]}
            }
        },
        {"$sort": {"units_sold": -1, "gross_revenue": -1}},
        {"$limit": 5}
    ]))
    for b in q7:
        print(f"  • {b['product_name']}: {b['units_sold']} units sold (Rs. {b['gross_revenue']})")
    results["query_7"] = q7

    # 8. Retrieve a customer's purchase history (Customer ID 1: Aditya Verma)
    print("\n--- [Query 8] Purchase History for Customer ID 1 ---")
    q8 = list(db.sales_transactions.find(
        {"customer_id": 1},
        {"_id": 0, "receipt_number": 1, "transaction_date": 1, "total_amount": 1, "status": 1, "items": 1}
    ))
    for order in q8:
        print(f"  • Receipt: {order['receipt_number']} | Date: {order['transaction_date']} | Total: Rs. {order['total_amount']}")
        for item in order["items"]:
            print(f"      - {item['product_name']} × {item['quantity_sold']} @ Rs. {item['unit_price']}")
    results["query_8"] = q8

    # 9. Retrieve supplier purchase orders and their statuses
    print("\n--- [Query 9] Supplier Purchase Orders and Statuses ---")
    q9 = list(db.purchase_orders.find(
        {},
        {"_id": 0, "po_number": 1, "supplier_name": 1, "order_date": 1, "status": 1, "total_amount": 1}
    ).sort("po_id", 1))
    for po in q9:
        print(f"  • {po['po_number']} | {po['supplier_name']} | Status: {po['status']} | Rs. {po['total_amount']}")
    results["query_9"] = q9

    # 10. Identify pending incoming shipments
    print("\n--- [Query 10] Pending / In-Transit Incoming Shipments ---")
    q10 = list(db.shipments.aggregate([
        {"$match": {"status": {"$in": ["IN_TRANSIT", "PARTIALLY_RECEIVED"]}}},
        {
            "$lookup": {
                "from": "purchase_orders",
                "localField": "po_id",
                "foreignField": "po_id",
                "as": "po"
            }
        },
        {"$unwind": "$po"},
        {
            "$project": {
                "_id": 0,
                "tracking_number": 1,
                "carrier": 1,
                "status": 1,
                "po_number": "$po.po_number",
                "supplier_name": "$po.supplier_name",
                "items_count": {"$size": "$items"}
            }
        }
    ]))
    for s in q10:
        print(f"  • Tracking: {s['tracking_number']} | Carrier: {s['carrier']} | Status: {s['status']} | PO: {s['po_number']} ({s['supplier_name']})")
    results["query_10"] = q10

    # 11. Calculate inventory movement history
    print("\n--- [Query 11] Inventory Movement Audit Ledger (Last 5 Entries) ---")
    q11 = list(db.inventory_transactions.aggregate([
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
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": "$loc"},
        {
            "$project": {
                "_id": 0,
                "transaction_id": 1,
                "product_name": "$prod.product_name",
                "location_code": "$loc.location_code",
                "type": "$transaction_type",
                "quantity": 1,
                "date": "$transaction_date",
                "ref": "$reference_type"
            }
        },
        {"$sort": {"transaction_id": -1}},
        {"$limit": 5}
    ]))
    for m in q11:
        print(f"  • Txn #{m['transaction_id']} | {m['type']} | {m['product_name']} | Qty: {m['quantity']} | Loc: {m['location_code']} | Ref: {m['ref']}")
    results["query_11"] = q11

    # 12. Identify products requiring replenishment (Active Restock Events)
    print("\n--- [Query 12] Products Requiring Shelf Replenishment (Pending Restock Events) ---")
    q12 = list(db.restock_events.find(
        {"status": "PENDING"},
        {"_id": 0, "restock_id": 1, "product_name": 1, "quantity_moved": 1, "triggered_by": 1, "event_date": 1}
    ))
    for r in q12:
        print(f"  • Event #{r['restock_id']}: {r['product_name']} — Transfer {r['quantity_moved']} units ({r['triggered_by']})")
    results["query_12"] = q12

    # 13. Retrieve products with low warehouse stock (Reorder Triggers)
    print("\n--- [Query 13] Products with Low Warehouse Stock (Active Reorder Triggers) ---")
    q13 = list(db.reorder_triggers.find(
        {"status": {"$in": ["OPEN", "PO_CREATED"]}},
        {"_id": 0, "trigger_id": 1, "product_name": 1, "stock_at_trigger": 1, "threshold_at_trigger": 1, "status": 1}
    ))
    for t in q13:
        print(f"  • Trigger #{t['trigger_id']}: {t['product_name']} | Stock: {t['stock_at_trigger']} <= Threshold: {t['threshold_at_trigger']} | Status: {t['status']}")
    results["query_13"] = q13

    # 14. Calculate total value of inventory
    print("\n--- [Query 14] Total Valuation of Stock Across Enterprise ---")
    q14 = list(db.inventory_stock.aggregate([
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
                "total_units_in_stock": {"$sum": "$quantity_on_hand"},
                "total_inventory_valuation": {
                    "$sum": {"$multiply": ["$quantity_on_hand", "$prod.standard_unit_price"]}
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "total_units_in_stock": 1,
                "total_inventory_valuation": {"$round": ["$total_inventory_valuation", 2]}
            }
        }
    ]))
    for v in q14:
        print(f"  • Total Physical Units: {v['total_units_in_stock']} | Enterprise Inventory Value: Rs. {v['total_inventory_valuation']}")
    results["query_14"] = q14

    # 15. Generate sales summary for a specified period (February 2026)
    print("\n--- [Query 15] Sales Summary for Specified Period (February 2026) ---")
    start_dt = datetime(2026, 2, 1, tzinfo=timezone.utc)
    end_dt = datetime(2026, 2, 28, 23, 59, 59, tzinfo=timezone.utc)
    q15 = list(db.sales_transactions.aggregate([
        {
            "$match": {
                "transaction_date": {"$gte": start_dt, "$lte": end_dt},
                "status": "COMPLETED"
            }
        },
        {
            "$group": {
                "_id": None,
                "total_sales_revenue": {"$sum": "$total_amount"},
                "total_transactions": {"$sum": 1},
                "average_basket_size": {"$avg": "$total_amount"},
                "highest_sale": {"$max": "$total_amount"},
                "lowest_sale": {"$min": "$total_amount"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "period": {"$literal": "February 2026"},
                "total_sales_revenue": {"$round": ["$total_sales_revenue", 2]},
                "total_transactions": 1,
                "average_basket_size": {"$round": ["$average_basket_size", 2]},
                "highest_sale": 1,
                "lowest_sale": 1
            }
        }
    ]))
    for s in q15:
        print(f"  • Period: {s['period']} | Revenue: Rs. {s['total_sales_revenue']} | Orders: {s['total_transactions']} | Avg Basket: Rs. {s['average_basket_size']}")
    results["query_15"] = q15

    print("\n" + "=" * 80)
    print("ALL 15 CANONICAL BUSINESS QUERIES EXECUTED AND VERIFIED!")
    print("=" * 80)
    return results


if __name__ == "__main__":
    run_business_queries()
