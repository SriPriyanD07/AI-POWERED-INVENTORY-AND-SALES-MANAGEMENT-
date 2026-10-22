"""
SmartRetail DA3 — Customer Repository
Module: da3_mongodb/src/repositories/customer_repository.py
"""

from typing import Optional, Dict, Any
from pymongo.database import Database
from da3_mongodb.src.repositories.base_repository import BaseRepository


class CustomerRepository(BaseRepository):
    def __init__(self, db: Optional[Database] = None):
        super().__init__("customers", db)

    def get_by_id(self, customer_id: int, session=None) -> Optional[Dict[str, Any]]:
        return self.find_one({"customer_id": customer_id}, session=session)

    def get_by_email(self, email: str, session=None) -> Optional[Dict[str, Any]]:
        return self.find_one({"email": email}, session=session)

    def update_loyalty_points(self, customer_id: int, points_delta: int, session=None) -> Any:
        return self.collection.update_one(
            {"customer_id": customer_id},
            {"$inc": {"loyalty_points": points_delta}},
            session=session
        )
