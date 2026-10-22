"""
SmartRetail DA3 — Inventory Repository
Module: da3_mongodb/src/repositories/inventory_repository.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo import ReturnDocument
from pymongo.database import Database
from da3_mongodb.src.repositories.base_repository import BaseRepository


class InventoryRepository:
    def __init__(self, db: Optional[Database] = None):
        self.stock_repo = BaseRepository("inventory_stock", db)
        self.location_repo = BaseRepository("inventory_locations", db)
        self.transaction_repo = BaseRepository("inventory_transactions", db)
        self.restock_repo = BaseRepository("restock_events", db)
        self.reorder_repo = BaseRepository("reorder_triggers", db)
        self.db = self.stock_repo.db

    def get_location(self, location_id: int, session=None) -> Optional[Dict[str, Any]]:
        return self.location_repo.find_one({"location_id": location_id}, session=session)

    def get_stock(self, location_id: int, product_id: int, session=None) -> Optional[Dict[str, Any]]:
        return self.stock_repo.find_one({"location_id": location_id, "product_id": product_id}, session=session)

    def get_product_stock_across_locations(self, product_id: int, session=None) -> List[Dict[str, Any]]:
        return list(self.stock_repo.collection.aggregate([
            {"$match": {"product_id": product_id}},
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
                    "location_id": 1,
                    "location_code": "$loc.location_code",
                    "location_name": "$loc.location_name",
                    "location_type": "$loc.location_type",
                    "quantity_on_hand": 1,
                    "reorder_threshold": 1,
                    "reorder_quantity": 1
                }
            }
        ], session=session))

    def atomic_decrement_stock(self, location_id: int, product_id: int, quantity: int, session=None) -> Optional[Dict[str, Any]]:
        """
        Atomically decrements stock using conditional filter { quantity_on_hand: { $gte: quantity } }.
        Guarantees that stock cannot drop below zero.
        """
        now = datetime.now(timezone.utc)
        return self.stock_repo.collection.find_one_and_update(
            {
                "location_id": location_id,
                "product_id": product_id,
                "quantity_on_hand": {"$gte": quantity}
            },
            {
                "$inc": {"quantity_on_hand": -quantity},
                "$set": {"last_updated_at": now}
            },
            return_document=ReturnDocument.AFTER,
            session=session
        )

    def atomic_increment_stock(self, location_id: int, product_id: int, quantity: int, default_threshold: int = 15, default_reorder_qty: int = 30, session=None) -> Dict[str, Any]:
        """
        Atomically increments stock or inserts a new stock record if absent (upsert).
        """
        now = datetime.now(timezone.utc)
        return self.stock_repo.collection.find_one_and_update(
            {"location_id": location_id, "product_id": product_id},
            {
                "$inc": {"quantity_on_hand": quantity},
                "$set": {"last_updated_at": now},
                "$setOnInsert": {
                    "reorder_threshold": default_threshold,
                    "reorder_quantity": default_reorder_qty
                }
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
            session=session
        )

    def record_inventory_transaction(self, product_id: int, location_id: int, txn_type: str, quantity: int, ref_type: str, ref_id: int, session=None) -> int:
        now = datetime.now(timezone.utc)
        max_tx = self.transaction_repo.find_one(sort=[("transaction_id", -1)], session=session)
        next_id = (max_tx["transaction_id"] + 1) if max_tx and "transaction_id" in max_tx else (self.transaction_repo.count() + 1)
        self.transaction_repo.insert_one({
            "transaction_id": next_id,
            "product_id": product_id,
            "location_id": location_id,
            "transaction_type": txn_type,
            "quantity": quantity,
            "transaction_date": now,
            "reference_type": ref_type,
            "reference_id": ref_id
        }, session=session)
        return next_id

    def create_restock_event(self, product_id: int, product_name: str, from_loc: int, to_loc: int, quantity: int, triggered_by: str = "AUTO_THRESHOLD", performed_by: Optional[int] = None, status: str = "PENDING", session=None) -> int:
        now = datetime.now(timezone.utc)
        max_r = self.restock_repo.find_one(sort=[("restock_id", -1)], session=session)
        next_id = (max_r["restock_id"] + 1) if max_r and "restock_id" in max_r else (self.restock_repo.count() + 1)
        self.restock_repo.insert_one({
            "restock_id": next_id,
            "product_id": product_id,
            "product_name": product_name,
            "from_location_id": from_loc,
            "to_location_id": to_loc,
            "quantity_moved": quantity,
            "event_date": now,
            "triggered_by": triggered_by,
            "performed_by": performed_by,
            "status": status
        }, session=session)
        return next_id

    def create_reorder_trigger(self, product_id: int, product_name: str, location_id: int, stock_at_trigger: int, threshold_at_trigger: int, generated_po_id: Optional[int] = None, status: str = "OPEN", session=None) -> int:
        now = datetime.now(timezone.utc)
        max_t = self.reorder_repo.find_one(sort=[("trigger_id", -1)], session=session)
        next_id = (max_t["trigger_id"] + 1) if max_t and "trigger_id" in max_t else (self.reorder_repo.count() + 1)
        self.reorder_repo.insert_one({
            "trigger_id": next_id,
            "product_id": product_id,
            "product_name": product_name,
            "location_id": location_id,
            "stock_at_trigger": stock_at_trigger,
            "threshold_at_trigger": threshold_at_trigger,
            "trigger_date": now,
            "generated_po_id": generated_po_id,
            "status": status
        }, session=session)
        return next_id
