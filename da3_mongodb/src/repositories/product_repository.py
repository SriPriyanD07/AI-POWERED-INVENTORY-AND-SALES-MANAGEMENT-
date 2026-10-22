"""
SmartRetail DA3 — Product Repository
Module: da3_mongodb/src/repositories/product_repository.py
"""

from typing import Optional, Dict, Any, List
from pymongo.database import Database
from da3_mongodb.src.repositories.base_repository import BaseRepository


class ProductRepository(BaseRepository):
    def __init__(self, db: Optional[Database] = None):
        super().__init__("products", db)

    def get_by_id(self, product_id: int, session=None) -> Optional[Dict[str, Any]]:
        return self.find_one({"product_id": product_id}, session=session)

    def get_by_sku(self, sku: str, session=None) -> Optional[Dict[str, Any]]:
        return self.find_one({"sku": sku}, session=session)

    def search_products(self, query: str, session=None) -> List[Dict[str, Any]]:
        return self.find(
            {"$or": [
                {"product_name": {"$regex": query, "$options": "i"}},
                {"sku": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]},
            session=session
        )
