"""
SmartRetail — MongoDB Connection & Transaction Handler
Module: da3_mongodb/src/database.py
"""

import os
import re
from contextlib import contextmanager
from pathlib import Path
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError, OperationFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


def get_masked_uri(uri: str) -> str:
    """Mask password in MongoDB URI for safe logging and error reporting."""
    if not uri:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", uri)


class DatabaseConnection:
    _instance = None
    _client: MongoClient = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
            try:
                cls._client = MongoClient(
                    MONGODB_URI,
                    serverSelectionTimeoutMS=8000,
                    connectTimeoutMS=10000,
                    retryWrites=True
                )
            except Exception as e:
                masked = get_masked_uri(MONGODB_URI)
                raise ConnectionError(f"Failed to initialize MongoDB client for {masked}: {e}") from e
        return cls._instance

    @property
    def client(self) -> MongoClient:
        return self._client

    def get_database(self, name: str = None) -> Database:
        db_name = name or DATABASE_NAME
        return self._client[db_name]

    def verify_connection(self) -> dict:
        """
        Explicitly ping the database cluster. Raises ConnectionError if unreachable.
        Does NOT silently fall back to localhost if remote connection fails.
        """
        try:
            return self._client.admin.command("ping")
        except Exception as e:
            masked = get_masked_uri(MONGODB_URI)
            raise ConnectionError(
                f"MongoDB connection verification failed for {masked}. "
                f"Ensure network access and IP whitelisting are properly configured. Error: {e}"
            ) from e

    def is_replica_set(self) -> bool:
        """Determines if MongoDB deployment supports multi-document transactions."""
        try:
            try:
                cmd_res = self._client.admin.command("hello")
            except Exception:
                cmd_res = self._client.admin.command("ismaster")
            return bool(cmd_res.get("setName")) or bool(cmd_res.get("msg") == "isdbgrid")
        except Exception:
            return False


db_conn = DatabaseConnection()


def get_db(db_name: str = None) -> Database:
    return db_conn.get_database(db_name)


@contextmanager
def managed_transaction(db_name: str = None):
    """
    Context manager that uses a native MongoDB transaction when supported by the deployment
    (replica set or mongos, such as MongoDB Atlas). If running on a standalone instance without
    replica sets, yields None to notify the calling service to execute atomic conditional operations ($inc, $gte).
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
        # Standalone deployment fallback (single-document atomic updates)
        yield None
