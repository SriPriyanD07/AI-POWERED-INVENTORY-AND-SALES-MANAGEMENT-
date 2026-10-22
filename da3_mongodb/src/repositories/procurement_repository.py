"""
SmartRetail DA3 — Procurement Repository
Module: da3_mongodb/src/repositories/procurement_repository.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo.database import Database
from da3_mongodb.src.repositories.base_repository import BaseRepository


class ProcurementRepository:
    def __init__(self, db: Optional[Database] = None):
        self.po_repo = BaseRepository("purchase_orders", db)
        self.shipment_repo = BaseRepository("shipments", db)
        self.supplier_repo = BaseRepository("suppliers", db)
        self.db = self.po_repo.db

    def get_po_by_number(self, po_number: str, session=None) -> Optional[Dict[str, Any]]:
        return self.po_repo.find_one({"po_number": po_number}, session=session)

    def get_shipment_by_tracking(self, tracking_number: str, session=None) -> Optional[Dict[str, Any]]:
        return self.shipment_repo.find_one({"tracking_number": tracking_number}, session=session)

    def insert_purchase_order(self, po_doc: Dict[str, Any], session=None) -> int:
        if "po_id" not in po_doc:
            max_po = self.po_repo.find_one(sort=[("po_id", -1)], session=session)
            po_doc["po_id"] = (max_po["po_id"] + 1) if max_po and "po_id" in max_po else (self.po_repo.count() + 1)
        self.po_repo.insert_one(po_doc, session=session)
        return po_doc["po_id"]

    def update_po_status(self, po_id: int, new_status: str, session=None) -> Any:
        return self.po_repo.collection.update_one(
            {"po_id": po_id},
            {"$set": {"status": new_status}},
            session=session
        )

    def insert_shipment(self, shipment_doc: Dict[str, Any], session=None) -> int:
        if "shipment_id" not in shipment_doc:
            max_s = self.shipment_repo.find_one(sort=[("shipment_id", -1)], session=session)
            shipment_doc["shipment_id"] = (max_s["shipment_id"] + 1) if max_s and "shipment_id" in max_s else (self.shipment_repo.count() + 1)
        self.shipment_repo.insert_one(shipment_doc, session=session)
        return shipment_doc["shipment_id"]

    def update_shipment_status(self, shipment_id: int, new_status: str, received_by: int, session=None) -> Any:
        now = datetime.now(timezone.utc)
        return self.shipment_repo.collection.update_one(
            {"shipment_id": shipment_id},
            {
                "$set": {
                    "status": new_status,
                    "received_date": now,
                    "received_by": received_by
                }
            },
            session=session
        )
