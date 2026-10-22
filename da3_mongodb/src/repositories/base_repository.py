"""
SmartRetail DA3 — Base Repository
Module: da3_mongodb/src/repositories/base_repository.py
"""

from typing import Any, Dict, List, Optional
from pymongo.collection import Collection
from pymongo.database import Database
from da3_mongodb.src.database import get_db


class BaseRepository:
    def __init__(self, collection_name: str, db: Optional[Database] = None):
        self.db = db if db is not None else get_db()
        self.collection: Collection = self.db[collection_name]

    def find_one(self, filter_query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None, sort=None, session=None) -> Optional[Dict[str, Any]]:
        query = filter_query if filter_query is not None else {}
        kwargs = {}
        if projection is not None:
            kwargs["projection"] = projection
        if sort is not None:
            kwargs["sort"] = sort
        if session is not None:
            kwargs["session"] = session
        return self.collection.find_one(query, **kwargs)

    def find(self, filter_query: Dict[str, Any] = None, projection: Optional[Dict[str, Any]] = None, sort=None, limit: int = 0, session=None) -> List[Dict[str, Any]]:
        query = filter_query or {}
        cursor = self.collection.find(query, projection=projection, session=session)
        if sort:
            cursor = cursor.sort(sort)
        if limit > 0:
            cursor = cursor.limit(limit)
        return list(cursor)

    def insert_one(self, document: Dict[str, Any], session=None) -> Any:
        return self.collection.insert_one(document, session=session)

    def update_one(self, filter_query: Dict[str, Any], update_doc: Dict[str, Any], session=None) -> Any:
        return self.collection.update_one(filter_query, update_doc, session=session)

    def delete_one(self, filter_query: Dict[str, Any], session=None) -> Any:
        return self.collection.delete_one(filter_query, session=session)

    def count(self, filter_query: Dict[str, Any] = None, session=None) -> int:
        return self.collection.count_documents(filter_query or {}, session=session)
