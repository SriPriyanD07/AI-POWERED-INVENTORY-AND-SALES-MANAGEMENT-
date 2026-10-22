"""
SmartRetail DA3 — Sales & Payment Repository
Module: da3_mongodb/src/repositories/sales_repository.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo.database import Database
from da3_mongodb.src.repositories.base_repository import BaseRepository


class SalesRepository:
    def __init__(self, db: Optional[Database] = None):
        self.sales_repo = BaseRepository("sales_transactions", db)
        self.payment_repo = BaseRepository("payments", db)
        self.db = self.sales_repo.db

    def get_by_receipt(self, receipt_number: str, session=None) -> Optional[Dict[str, Any]]:
        return self.sales_repo.find_one({"receipt_number": receipt_number}, session=session)

    def insert_sales_transaction(self, sale_doc: Dict[str, Any], session=None) -> int:
        if "transaction_id" not in sale_doc:
            max_s = self.sales_repo.find_one(sort=[("transaction_id", -1)], session=session)
            sale_doc["transaction_id"] = (max_s["transaction_id"] + 1) if max_s and "transaction_id" in max_s else (self.sales_repo.count() + 1)
        self.sales_repo.insert_one(sale_doc, session=session)
        return sale_doc["transaction_id"]

    def insert_payments(self, payments_list: List[Dict[str, Any]], session=None) -> List[int]:
        inserted_ids = []
        max_p = self.payment_repo.find_one(sort=[("payment_id", -1)], session=session)
        base_id = (max_p["payment_id"] + 1) if max_p and "payment_id" in max_p else (self.payment_repo.count() + 1)
        for idx, p in enumerate(payments_list):
            pid = p.get("payment_id", base_id + idx)
            p_doc = {
                "payment_id": pid,
                "transaction_id": p["transaction_id"],
                "receipt_number": p.get("receipt_number"),
                "payment_method": p["payment_method"],
                "amount": p["amount"],
                "payment_date": p.get("payment_date", datetime.now(timezone.utc)),
                "reference_number": p.get("reference_number"),
                "status": p.get("status", "SUCCESS")
            }
            self.payment_repo.insert_one(p_doc, session=session)
            inserted_ids.append(pid)
        return inserted_ids
