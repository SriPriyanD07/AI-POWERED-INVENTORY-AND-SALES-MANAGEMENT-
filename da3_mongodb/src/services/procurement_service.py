"""
SmartRetail DA3 — Procurement Service
Module: da3_mongodb/src/services/procurement_service.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo.database import Database
from da3_mongodb.src.database import get_db
from da3_mongodb.src.repositories.procurement_repository import ProcurementRepository
from da3_mongodb.src.repositories.inventory_repository import InventoryRepository
from da3_mongodb.src.repositories.product_repository import ProductRepository


class ProcurementService:
    def __init__(self, db: Optional[Database] = None):
        self.db = db if db is not None else get_db()
        self.procurement_repo = ProcurementRepository(self.db)
        self.inventory_repo = InventoryRepository(self.db)
        self.product_repo = ProductRepository(self.db)

    def create_purchase_order(
        self,
        po_number: str,
        supplier_id: int,
        created_by: int,
        items: List[Dict[str, Any]],
        is_auto_generated: bool = False,
        trigger_id: Optional[int] = None
    ) -> Dict[str, Any]:
        existing = self.procurement_repo.get_po_by_number(po_number)
        if existing:
            raise ValueError(f"Purchase order with number '{po_number}' already exists.")

        supplier = self.procurement_repo.supplier_repo.find_one({"supplier_id": supplier_id})
        if not supplier:
            raise ValueError(f"Supplier ID {supplier_id} does not exist.")

        validated_items = []
        total_amount = 0.0

        for itm in items:
            prod = self.product_repo.get_by_id(itm["product_id"])
            if not prod:
                raise ValueError(f"Product ID {itm['product_id']} does not exist.")
            qty = itm["quantity_ordered"]
            unit_price = itm.get("unit_price", float(prod["standard_unit_price"]))
            subtotal = round(qty * unit_price, 2)
            total_amount += subtotal

            validated_items.append({
                "product_id": itm["product_id"],
                "sku": prod["sku"],
                "product_name": prod["product_name"],
                "quantity_ordered": qty,
                "unit_price": unit_price,
                "subtotal": subtotal
            })

        total_amount = round(total_amount, 2)
        now = datetime.now(timezone.utc)

        po_doc = {
            "po_number": po_number,
            "supplier_id": supplier_id,
            "supplier_name": supplier["supplier_name"],
            "created_by": created_by,
            "order_date": now,
            "expected_delivery_date": None,
            "status": "APPROVED",
            "total_amount": total_amount,
            "is_auto_generated": "TRUE" if is_auto_generated else "FALSE",
            "items": validated_items
        }

        po_id = self.procurement_repo.insert_purchase_order(po_doc)

        # If created from an active reorder trigger, mark trigger as PO_CREATED
        if trigger_id:
            self.inventory_repo.reorder_repo.collection.update_one(
                {"trigger_id": trigger_id},
                {"$set": {"status": "PO_CREATED", "generated_po_id": po_id}}
            )

        return {
            "success": True,
            "po_id": po_id,
            "po_number": po_number,
            "supplier_name": supplier["supplier_name"],
            "total_amount": total_amount,
            "items_count": len(validated_items),
            "status": "APPROVED"
        }

    def receive_shipment(
        self,
        shipment_id: int,
        warehouse_location_id: int,
        received_by: int
    ) -> Dict[str, Any]:
        shipment = self.procurement_repo.shipment_repo.find_one({"shipment_id": shipment_id})
        if not shipment:
            raise ValueError(f"Shipment ID {shipment_id} does not exist.")

        if shipment["status"] == "RECEIVED":
            raise ValueError(f"Shipment ID {shipment_id} has already been received.")

        target_loc = self.inventory_repo.get_location(warehouse_location_id)
        if not target_loc:
            raise ValueError(f"Warehouse Location ID {warehouse_location_id} does not exist.")

        if target_loc["location_type"] != "WAREHOUSE":
            raise ValueError("Shipment Receiving Error: Inbound goods must enter a WAREHOUSE, not a SHELF.")

        # Update items received and increment warehouse inventory
        updated_items = []
        for itm in shipment["items"]:
            prod_id = itm["product_id"]
            qty = itm["quantity_shipped"]

            # Update live warehouse stock
            stk = self.inventory_repo.atomic_increment_stock(
                location_id=warehouse_location_id,
                product_id=prod_id,
                quantity=qty,
                default_threshold=20,
                default_reorder_qty=50
            )

            # Record RECEIPT audit ledger
            self.inventory_repo.record_inventory_transaction(
                product_id=prod_id,
                location_id=warehouse_location_id,
                txn_type="RECEIPT",
                quantity=qty,
                ref_type="SHIPMENT",
                ref_id=shipment_id
            )

            # Resolve any active reorder triggers for this product in this warehouse
            self.inventory_repo.reorder_repo.collection.update_many(
                {"product_id": prod_id, "location_id": warehouse_location_id, "status": {"$in": ["OPEN", "PO_CREATED"]}},
                {"$set": {"status": "RESOLVED"}}
            )

            itm["quantity_received"] = qty
            updated_items.append(itm)

        # Update shipment status
        self.procurement_repo.shipment_repo.collection.update_one(
            {"shipment_id": shipment_id},
            {
                "$set": {
                    "status": "RECEIVED",
                    "received_date": datetime.now(timezone.utc),
                    "received_by": received_by,
                    "items": updated_items
                }
            }
        )

        # Update parent purchase order status to COMPLETED
        po_id = shipment.get("po_id")
        if po_id:
            self.procurement_repo.update_po_status(po_id, "COMPLETED")

        return {
            "success": True,
            "shipment_id": shipment_id,
            "tracking_number": shipment["tracking_number"],
            "warehouse_code": target_loc["location_code"],
            "items_received_count": len(updated_items),
            "status": "RECEIVED"
        }
