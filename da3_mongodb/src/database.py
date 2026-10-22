"""
SmartRetail DA3 — MongoDB Connection & Transaction Handler
Module: da3_mongodb/src/database.py
"""

import os
from contextlib import contextmanager
from pathlib import Path
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError, OperationFailure
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


class DatabaseConnection:
    _instance = None
    _client: MongoClient = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            cls._client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        return cls._instance

    @property
    def client(self) -> MongoClient:
        return self._client

    def get_database(self, name: str = None) -> Database:
        db_name = name or DATABASE_NAME
        return self._client[db_name]

    def is_replica_set(self) -> bool:
        """Determines if MongoDB deployment supports multi-document transactions."""
        try:
            ismaster = self._client.admin.command("ismaster")
            return bool(ismaster.get("setName")) or bool(ismaster.get("msg") == "isdbgrid")
        except Exception:
            return False


db_conn = DatabaseConnection()


def get_db(db_name: str = None) -> Database:
    return db_conn.get_database(db_name)


@contextmanager
def managed_transaction(db_name: str = None):
    """
    Context manager that uses a native MongoDB transaction when supported by the deployment
    (replica set or mongos). If running on a standalone instance, yields None to notify
    the calling service to execute atomic conditional operations ($inc, $gte) with compensating sagas.
    """
    client = db_conn.client
    if db_conn.is_replica_set():
        with client.start_session() as session:
            with session.start_transaction():
                try:
                    yield session
                except Exception:
                    session.abort_transaction()
                    raise
    else:
        # Standalone deployment fallback
        yield None
