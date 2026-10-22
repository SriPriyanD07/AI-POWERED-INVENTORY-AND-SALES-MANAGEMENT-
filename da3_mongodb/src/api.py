"""
SmartRetail DA3 — FastAPI REST Application & Full-Stack API
Module: da3_mongodb/src/api.py
"""

from typing import Optional, List
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from da3_mongodb.src.database import get_db
from da3_mongodb.src.models import (
    SaleRequest, StockTransferRequest, ReceiveShipmentRequest, CreatePurchaseOrderRequest,
    ProductCreate, ProductUpdate, SupplierCreate, SupplierUpdate, StockThresholdUpdate,
    PurchaseOrderStatusUpdate
)
from da3_mongodb.src.services.sales_service import SalesService
from da3_mongodb.src.services.inventory_service import InventoryService
from da3_mongodb.src.services.procurement_service import ProcurementService
from da3_mongodb.src.services.workflow_service import WorkflowService
from da3_mongodb.src.services.ai_forecasting_service import AIForecastingService

app = FastAPI(
    title="SmartRetail — AI-Powered DBMS (MongoDB DA3)",
    description=(
        "Production-grade MongoDB document implementation for SmartRetail enterprise operations. "
        "Supports real-time warehouse-to-shelf synchronization, POS checkout with split-tender payments, "
        "automated replenishment triggers, inventory transfers, and advanced aggregation analytics."
    ),
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_db()
sales_svc = SalesService(db)
inventory_svc = InventoryService(db)
procurement_svc = ProcurementService(db)
workflow_svc = WorkflowService(db)
ai_forecasting_svc = AIForecastingService(db)


@app.get("/", tags=["Health & Info"])
def root():
    return {
        "system": "SmartRetail DBMS (DA3 - MongoDB)",
        "status": "OPERATIONAL",
        "database": db.name,
        "docs_url": "/docs",
        "supported_collections": db.list_collection_names()
    }


# ==============================================================================
# 1. PRODUCTS & CATEGORIES
# ==============================================================================
@app.get("/product-categories", tags=["Products"])
def list_categories():
    return list(db.product_categories.find({}, {"_id": 0}).sort("category_id", 1))


@app.get("/products", tags=["Products"])
def list_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    is_active: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if is_active:
        query["is_active"] = is_active.upper()
    if search:
        query["$or"] = [
            {"product_name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}}
        ]
    cursor = db.products.find(query, {"_id": 0}).sort("product_id", 1).limit(limit)
    return list(cursor)


@app.get("/products/{product_id}", tags=["Products"])
def get_product(product_id: int):
    prod = db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found.")
    return prod


@app.post("/products", tags=["Products"], status_code=status.HTTP_201_CREATED)
def create_product(req: ProductCreate):
    # Check duplicate SKU or Barcode
    if db.products.find_one({"sku": req.sku}):
        raise HTTPException(status_code=400, detail=f"Product with SKU '{req.sku}' already exists.")
    if db.products.find_one({"barcode": req.barcode}):
        raise HTTPException(status_code=400, detail=f"Product with barcode '{req.barcode}' already exists.")

    cat = db.product_categories.find_one({"category_id": req.category_id})
    category_name = cat["category_name"] if cat else "General"

    # Generate sequential product_id
    max_p = db.products.find_one(sort=[("product_id", -1)])
    next_id = (max_p["product_id"] + 1) if max_p and "product_id" in max_p else 1

    doc = {
        "product_id": next_id,
        "sku": req.sku,
        "barcode": req.barcode,
        "product_name": req.product_name,
        "description": req.description or "",
        "category_id": req.category_id,
        "category_name": category_name,
        "unit_of_measure": req.unit_of_measure,
        "standard_unit_price": float(req.standard_unit_price),
        "is_active": req.is_active.upper()
    }
    db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.put("/products/{product_id}", tags=["Products"])
def update_product(product_id: int, req: ProductUpdate):
    prod = db.products.find_one({"product_id": product_id})
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found.")

    update_fields = {}
    if req.product_name is not None:
        update_fields["product_name"] = req.product_name
    if req.description is not None:
        update_fields["description"] = req.description
    if req.category_id is not None:
        cat = db.product_categories.find_one({"category_id": req.category_id})
        update_fields["category_id"] = req.category_id
        if cat:
            update_fields["category_name"] = cat["category_name"]
    if req.unit_of_measure is not None:
        update_fields["unit_of_measure"] = req.unit_of_measure
    if req.standard_unit_price is not None:
        update_fields["standard_unit_price"] = float(req.standard_unit_price)
    if req.is_active is not None:
        update_fields["is_active"] = req.is_active.upper()

    if update_fields:
        db.products.update_one({"product_id": product_id}, {"$set": update_fields})

    updated = db.products.find_one({"product_id": product_id}, {"_id": 0})
    return updated


@app.delete("/products/{product_id}", tags=["Products"])
def delete_product(product_id: int):
    prod = db.products.find_one({"product_id": product_id})
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found.")

    # Soft delete / toggle active
    db.products.update_one({"product_id": product_id}, {"$set": {"is_active": "FALSE"}})
    return {"success": True, "message": f"Product {product_id} marked as inactive."}


# ==============================================================================
# 2. INVENTORY & LOCATIONS
# ==============================================================================
@app.get("/inventory/locations", tags=["Inventory"])
def list_inventory_locations():
    return list(db.inventory_locations.find({}, {"_id": 0}).sort("location_id", 1))


@app.get("/inventory/all-stock", tags=["Inventory"])
def list_all_inventory_stock(location_id: Optional[int] = None, location_type: Optional[str] = None):
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
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": "$loc"}
    ]

    match_stage = {}
    if location_id:
        match_stage["location_id"] = location_id
    if location_type:
        match_stage["loc.location_type"] = location_type.upper()

    if match_stage:
        pipeline.append({"$match": match_stage})

    pipeline.extend([
        {
            "$project": {
                "_id": 0,
                "location_id": 1,
                "product_id": 1,
                "sku": "$prod.sku",
                "product_name": "$prod.product_name",
                "category_name": "$prod.category_name",
                "standard_unit_price": "$prod.standard_unit_price",
                "location_code": "$loc.location_code",
                "location_name": "$loc.location_name",
                "location_type": "$loc.location_type",
                "quantity_on_hand": 1,
                "reorder_threshold": 1,
                "reorder_quantity": 1,
                "is_low_stock": {"$lte": ["$quantity_on_hand", "$reorder_threshold"]},
                "last_updated_at": 1
            }
        },
        {"$sort": {"location_id": 1, "product_id": 1}}
    ])

    return list(db.inventory_stock.aggregate(pipeline))


@app.get("/inventory/stock/{product_id}", tags=["Inventory"])
def get_product_stock(product_id: int):
    return inventory_svc.inventory_repo.get_product_stock_across_locations(product_id)


@app.get("/inventory/low-stock", tags=["Inventory"])
def get_low_stock_products():
    """Identifies products below shelf threshold or warehouse safety stock."""
    shelf_low = list(db.inventory_stock.aggregate([
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
                "sku": "$prod.sku",
                "product_name": "$prod.product_name",
                "location_code": "$loc.location_code",
                "location_name": "$loc.location_name",
                "quantity_on_hand": 1,
                "reorder_threshold": 1,
                "reorder_quantity": 1,
                "deficit": {"$subtract": ["$reorder_threshold", "$quantity_on_hand"]}
            }
        }
    ]))
    warehouse_low = list(db.inventory_stock.aggregate([
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
                "loc.location_type": "WAREHOUSE",
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
                "sku": "$prod.sku",
                "product_name": "$prod.product_name",
                "location_code": "$loc.location_code",
                "location_name": "$loc.location_name",
                "quantity_on_hand": 1,
                "reorder_threshold": 1,
                "reorder_quantity": 1,
                "deficit": {"$subtract": ["$reorder_threshold", "$quantity_on_hand"]}
            }
        }
    ]))
    return {
        "shelf_below_threshold": shelf_low,
        "warehouse_below_threshold": warehouse_low
    }


@app.put("/inventory/thresholds/{location_id}/{product_id}", tags=["Inventory"])
def update_stock_thresholds(location_id: int, product_id: int, req: StockThresholdUpdate):
    stk = db.inventory_stock.find_one({"location_id": location_id, "product_id": product_id})
    if not stk:
        raise HTTPException(status_code=404, detail="Stock record not found for location and product.")

    db.inventory_stock.update_one(
        {"location_id": location_id, "product_id": product_id},
        {"$set": {
            "reorder_threshold": req.reorder_threshold,
            "reorder_quantity": req.reorder_quantity,
            "last_updated_at": datetime.now(timezone.utc)
        }}
    )
    return {"success": True, "location_id": location_id, "product_id": product_id, "thresholds": req.model_dump()}


@app.post("/inventory/transfer", tags=["Inventory"])
def transfer_inventory(req: StockTransferRequest):
    try:
        return inventory_svc.transfer_stock(
            product_id=req.product_id,
            from_location_id=req.from_location_id,
            to_location_id=req.to_location_id,
            quantity=req.quantity,
            employee_id=req.employee_id,
            triggered_by=req.triggered_by
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/inventory/transactions", tags=["Inventory"])
def list_inventory_transactions(limit: int = 50):
    pipeline = [
        {
            "$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "product_id",
                "as": "prod"
            }
        },
        {"$unwind": {"path": "$prod", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": {"path": "$loc", "preserveNullAndEmptyArrays": True}},
        {
            "$project": {
                "_id": 0,
                "transaction_id": 1,
                "product_id": 1,
                "product_name": "$prod.product_name",
                "location_id": 1,
                "location_code": "$loc.location_code",
                "location_type": "$loc.location_type",
                "transaction_type": 1,
                "quantity": 1,
                "transaction_date": 1,
                "reference_type": 1,
                "reference_id": 1
            }
        },
        {"$sort": {"transaction_id": -1}},
        {"$limit": limit}
    ]
    return list(db.inventory_transactions.aggregate(pipeline))


# ==============================================================================
# 3. SALES & POINT OF SALE
# ==============================================================================
@app.get("/customers", tags=["Sales"])
def list_customers():
    return list(db.customers.find({}, {"_id": 0}).sort("customer_id", 1))


@app.get("/employees", tags=["Sales"])
def list_employees(role: Optional[str] = None):
    query = {"role": role.upper()} if role else {}
    return list(db.employees.find(query, {"_id": 0}).sort("employee_id", 1))


@app.post("/sales/checkout", tags=["Sales"], status_code=status.HTTP_201_CREATED)
def record_sale(req: SaleRequest):
    try:
        items_payload = [item.model_dump() for item in req.items]
        payments_payload = [p.model_dump() for p in req.payments]
        return sales_svc.process_sale(
            receipt_number=req.receipt_number,
            cashier_id=req.cashier_id,
            customer_id=req.customer_id,
            items=items_payload,
            payments=payments_payload
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/sales/history", tags=["Sales"])
def get_sales_history(customer_id: Optional[int] = None, limit: int = 50):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    cursor = db.sales_transactions.find(query, {"_id": 0}).sort("transaction_date", -1).limit(limit)
    return list(cursor)


# ==============================================================================
# 4. SUPPLIERS
# ==============================================================================
@app.get("/suppliers", tags=["Suppliers"])
def list_suppliers():
    return list(db.suppliers.find({}, {"_id": 0}).sort("supplier_id", 1))


@app.post("/suppliers", tags=["Suppliers"], status_code=status.HTTP_201_CREATED)
def create_supplier(req: SupplierCreate):
    if db.suppliers.find_one({"gst_number": req.gst_number}):
        raise HTTPException(status_code=400, detail=f"Supplier with GST '{req.gst_number}' already exists.")
    if db.suppliers.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail=f"Supplier with email '{req.email}' already exists.")

    max_s = db.suppliers.find_one(sort=[("supplier_id", -1)])
    next_id = (max_s["supplier_id"] + 1) if max_s and "supplier_id" in max_s else 1

    doc = {
        "supplier_id": next_id,
        "supplier_name": req.supplier_name,
        "contact_person": req.contact_person or "",
        "email": req.email,
        "gst_number": req.gst_number,
        "phone_numbers": req.phone_numbers or [],
        "address": {
            "street": req.street or "",
            "city": req.city or "",
            "state": req.state or "",
            "pincode": req.pincode or ""
        },
        "rating": float(req.rating) if req.rating is not None else 4.0,
        "created_at": datetime.now(timezone.utc)
    }
    db.suppliers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@app.put("/suppliers/{supplier_id}", tags=["Suppliers"])
def update_supplier(supplier_id: int, req: SupplierUpdate):
    supp = db.suppliers.find_one({"supplier_id": supplier_id})
    if not supp:
        raise HTTPException(status_code=404, detail=f"Supplier ID {supplier_id} not found.")

    update_fields = {}
    if req.supplier_name is not None:
        update_fields["supplier_name"] = req.supplier_name
    if req.contact_person is not None:
        update_fields["contact_person"] = req.contact_person
    if req.email is not None:
        update_fields["email"] = req.email
    if req.gst_number is not None:
        update_fields["gst_number"] = req.gst_number
    if req.phone_numbers is not None:
        update_fields["phone_numbers"] = req.phone_numbers
    if req.rating is not None:
        update_fields["rating"] = float(req.rating)

    addr = supp.get("address", {})
    if req.street is not None:
        addr["street"] = req.street
    if req.city is not None:
        addr["city"] = req.city
    if req.state is not None:
        addr["state"] = req.state
    if req.pincode is not None:
        addr["pincode"] = req.pincode
    update_fields["address"] = addr

    db.suppliers.update_one({"supplier_id": supplier_id}, {"$set": update_fields})
    return db.suppliers.find_one({"supplier_id": supplier_id}, {"_id": 0})


@app.delete("/suppliers/{supplier_id}", tags=["Suppliers"])
def delete_supplier(supplier_id: int):
    supp = db.suppliers.find_one({"supplier_id": supplier_id})
    if not supp:
        raise HTTPException(status_code=404, detail=f"Supplier ID {supplier_id} not found.")

    db.suppliers.delete_one({"supplier_id": supplier_id})
    return {"success": True, "message": f"Supplier {supplier_id} deleted."}


# ==============================================================================
# 5. PURCHASE ORDERS & SHIPMENTS
# ==============================================================================
@app.get("/procurement/purchase-orders", tags=["Procurement"])
def list_purchase_orders(status: Optional[str] = None):
    query = {"status": status.upper()} if status else {}
    return list(db.purchase_orders.find(query, {"_id": 0}).sort("po_id", -1))


@app.post("/procurement/purchase-orders", tags=["Procurement"], status_code=status.HTTP_201_CREATED)
def create_purchase_order(req: CreatePurchaseOrderRequest):
    try:
        return procurement_svc.create_purchase_order(
            po_number=req.po_number,
            supplier_id=req.supplier_id,
            created_by=req.created_by,
            items=req.items,
            is_auto_generated=req.is_auto_generated
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@app.put("/procurement/purchase-orders/{po_id}/status", tags=["Procurement"])
def update_purchase_order_status(po_id: int, req: PurchaseOrderStatusUpdate):
    po = db.purchase_orders.find_one({"po_id": po_id})
    if not po:
        raise HTTPException(status_code=404, detail=f"PO ID {po_id} not found.")

    db.purchase_orders.update_one({"po_id": po_id}, {"$set": {"status": req.status}})
    return {"success": True, "po_id": po_id, "status": req.status}


@app.get("/procurement/shipments", tags=["Procurement"])
def list_shipments(status: Optional[str] = None):
    query = {"status": status.upper()} if status else {}
    return list(db.shipments.find(query, {"_id": 0}).sort("shipment_id", -1))


@app.post("/procurement/shipments/receive", tags=["Procurement"])
def receive_shipment(req: ReceiveShipmentRequest):
    try:
        return procurement_svc.receive_shipment(
            shipment_id=req.shipment_id,
            warehouse_location_id=req.warehouse_location_id,
            received_by=req.received_by
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# ==============================================================================
# 6. REORDER MANAGEMENT & REPLENISHMENT
# ==============================================================================
@app.get("/reorders/restock-events", tags=["Reorders"])
def list_restock_events(status: Optional[str] = None):
    query = {"status": status.upper()} if status else {}
    return list(db.restock_events.find(query, {"_id": 0}).sort("restock_id", -1))


@app.get("/reorders/reorder-triggers", tags=["Reorders"])
def list_reorder_triggers(status: Optional[str] = None):
    query = {"status": status.upper()} if status else {}
    return list(db.reorder_triggers.find(query, {"_id": 0}).sort("trigger_id", -1))


@app.post("/reorders/restock-events/{restock_id}/fulfill", tags=["Reorders"])
def fulfill_restock_event(restock_id: int, employee_id: int = 5):
    evt = db.restock_events.find_one({"restock_id": restock_id})
    if not evt:
        raise HTTPException(status_code=404, detail="Restock event not found.")
    if evt["status"] == "COMPLETED":
        raise HTTPException(status_code=400, detail="Restock event already completed.")

    # Execute transfer
    res = inventory_svc.transfer_stock(
        product_id=evt["product_id"],
        from_location_id=evt["from_location_id"],
        to_location_id=evt["to_location_id"],
        quantity=evt["quantity_moved"],
        employee_id=employee_id,
        triggered_by="FULFILL_RESTOCK_EVENT"
    )

    db.restock_events.update_one(
        {"restock_id": restock_id},
        {"$set": {"status": "COMPLETED", "performed_by": employee_id}}
    )
    return {"success": True, "message": "Restock transfer executed and event completed.", "details": res}


@app.post("/reorders/reorder-triggers/{trigger_id}/generate-po", tags=["Reorders"])
def auto_generate_po_from_trigger(trigger_id: int, supplier_id: Optional[int] = None, created_by: int = 4):
    trig = db.reorder_triggers.find_one({"trigger_id": trigger_id})
    if not trig:
        raise HTTPException(status_code=404, detail="Reorder trigger not found.")
    if trig["status"] == "PO_CREATED":
        raise HTTPException(status_code=400, detail="Purchase order already generated for this trigger.")

    prod = db.products.find_one({"product_id": trig["product_id"]})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Resolve supplier: use provided or fallback to supplier 1 or first active supplier
    target_supp_id = supplier_id or 1
    supp = db.suppliers.find_one({"supplier_id": target_supp_id}) or db.suppliers.find_one()
    if not supp:
        raise HTTPException(status_code=400, detail="No active supplier found.")

    po_number = f"PO-AUTO-{int(datetime.now().timestamp())}"
    res = procurement_svc.create_purchase_order(
        po_number=po_number,
        supplier_id=supp["supplier_id"],
        created_by=created_by,
        items=[{
            "product_id": trig["product_id"],
            "quantity_ordered": 50,
            "unit_price": float(prod["standard_unit_price"]) * 0.8  # wholesale contracted price
        }],
        is_auto_generated=True,
        trigger_id=trigger_id
    )
    return res


# ==============================================================================
# 7. ANALYTICS & REPORTS
# ==============================================================================
@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """Generates real-time KPIs across stock valuation, sales totals, and alerts."""
    total_val = list(db.inventory_stock.aggregate([
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
                "total_units": {"$sum": "$quantity_on_hand"},
                "total_inventory_value": {"$sum": {"$multiply": ["$quantity_on_hand", "$prod.standard_unit_price"]}}
            }
        }
    ]))
    sales_val = list(db.sales_transactions.aggregate([
        {"$match": {"status": "COMPLETED"}},
        {
            "$group": {
                "_id": None,
                "total_revenue": {"$sum": "$total_amount"},
                "total_sales_count": {"$sum": 1}
            }
        }
    ]))

    inventory_kpi = total_val[0] if total_val else {"total_units": 0, "total_inventory_value": 0}
    sales_kpi = sales_val[0] if sales_val else {"total_revenue": 0, "total_sales_count": 0}

    return {
        "inventory": {
            "total_physical_units": inventory_kpi.get("total_units", 0),
            "total_inventory_value_inr": round(inventory_kpi.get("total_inventory_value", 0), 2)
        },
        "sales": {
            "total_completed_sales": sales_kpi.get("total_sales_count", 0),
            "total_revenue_inr": round(sales_kpi.get("total_revenue", 0), 2)
        },
        "total_products": db.products.count_documents({}),
        "pending_purchase_orders": db.purchase_orders.count_documents({"status": {"$in": ["DRAFT", "PENDING", "APPROVED", "SHIPPED", "PARTIALLY_RECEIVED"]}}),
        "active_alerts": {
            "pending_restock_events": db.restock_events.count_documents({"status": "PENDING"}),
            "open_reorder_triggers": db.reorder_triggers.count_documents({"status": "OPEN"})
        }
    }


@app.get("/analytics/daily-sales", tags=["Analytics"])
def get_daily_sales():
    pipeline = [
        {"$match": {"status": "COMPLETED"}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$transaction_date"}
                },
                "total_revenue": {"$sum": "$total_amount"},
                "receipts_count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "revenue": {"$round": ["$total_revenue", 2]},
                "receipts_count": 1
            }
        },
        {"$sort": {"date": 1}}
    ]
    return list(db.sales_transactions.aggregate(pipeline))


@app.get("/reports/category-revenue", tags=["Reports"])
def get_category_revenue():
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
                "revenue": {"$sum": "$items.subtotal"},
                "units_sold": {"$sum": "$items.quantity_sold"},
                "orders_count": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "category_name": "$_id",
                "revenue": {"$round": ["$revenue", 2]},
                "units_sold": 1,
                "orders_count": 1
            }
        },
        {"$sort": {"revenue": -1}}
    ]
    return list(db.sales_transactions.aggregate(pipeline))


@app.get("/reports/best-sellers", tags=["Reports"])
def get_best_sellers(limit: int = 10):
    pipeline = [
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "product_name": {"$first": "$items.product_name"},
                "sku": {"$first": "$items.sku"},
                "units_sold": {"$sum": "$items.quantity_sold"},
                "gross_revenue": {"$sum": "$items.subtotal"}
            }
        },
        {
            "$project": {
                "_id": 0,
                "product_id": "$_id",
                "sku": 1,
                "product_name": 1,
                "units_sold": 1,
                "gross_revenue": {"$round": ["$gross_revenue", 2]}
            }
        },
        {"$sort": {"units_sold": -1, "gross_revenue": -1}},
        {"$limit": limit}
    ]
    return list(db.sales_transactions.aggregate(pipeline))


@app.get("/reports/inventory-valuation", tags=["Reports"])
def get_inventory_valuation():
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
            "$lookup": {
                "from": "inventory_locations",
                "localField": "location_id",
                "foreignField": "location_id",
                "as": "loc"
            }
        },
        {"$unwind": "$loc"},
        {
            "$group": {
                "_id": {
                    "location_type": "$loc.location_type",
                    "location_code": "$loc.location_code",
                    "location_name": "$loc.location_name"
                },
                "total_units": {"$sum": "$quantity_on_hand"},
                "total_valuation": {"$sum": {"$multiply": ["$quantity_on_hand", "$prod.standard_unit_price"]}},
                "unique_skus": {"$sum": 1}
            }
        },
        {
            "$project": {
                "_id": 0,
                "location_type": "$_id.location_type",
                "location_code": "$_id.location_code",
                "location_name": "$_id.location_name",
                "total_units": 1,
                "total_valuation": {"$round": ["$total_valuation", 2]},
                "unique_skus": 1
            }
        },
        {"$sort": {"location_type": -1, "total_valuation": -1}}
    ]
    return list(db.inventory_stock.aggregate(pipeline))


# ==============================================================================
# 8. WORKFLOW DEMONSTRATION
# ==============================================================================
@app.post("/workflow/demonstrate", tags=["Workflow"])
def trigger_workflow_demo():
    """Triggers the complete 5-stage retail lifecycle automatically."""
    import logging
    logger = logging.getLogger("smartretail.workflow")
    try:
        return workflow_svc.run_end_to_end_demonstration()
    except ValueError as ve:
        logger.warning(f"Workflow demonstration rejected by business rule: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except RuntimeError as re:
        logger.error(f"Workflow demonstration encountered execution conflict: {re}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(re)
        )
    except Exception as e:
        logger.exception(f"Unexpected exception during workflow demonstration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow demonstration execution failed: {str(e)}"
        )


# ==============================================================================
# 9. AI DEMAND FORECASTING & PREDICTIVE REPLENISHMENT
# ==============================================================================
@app.get("/ai/forecast/overview", tags=["AI Demand Forecasting"])
def get_ai_forecast_overview(horizon_days: int = Query(7, ge=1, le=60)):
    """Provides a catalog-wide predictive demand overview and stockout risk ranking."""
    try:
        return ai_forecasting_svc.get_forecast_overview(horizon_days=horizon_days)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/ai/forecast/product/{product_id}", tags=["AI Demand Forecasting"])
def get_product_ai_forecast(product_id: int, horizon_days: int = Query(14, ge=1, le=90)):
    """Computes daily demand predictions with 95% confidence intervals and safety stock recommendations."""
    try:
        return ai_forecasting_svc.generate_product_forecast(product_id=product_id, horizon_days=horizon_days)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/ai/forecast/apply-recommendation/{product_id}", tags=["AI Demand Forecasting"])
def apply_ai_recommendation(product_id: int):
    """Applies AI-suggested safety threshold and batch replenishment values to inventory records."""
    try:
        return ai_forecasting_svc.apply_ai_recommendation(product_id=product_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/ai/forecast/generate-po/{product_id}", tags=["AI Demand Forecasting"])
def generate_preventive_purchase_order(product_id: int, created_by: int = 4):
    """Issues a proactive purchase order based on forecasted demand before stockout occurs."""
    try:
        return ai_forecasting_svc.generate_preventive_purchase_order(product_id=product_id, created_by=created_by)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

