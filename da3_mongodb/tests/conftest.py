"""
SmartRetail DA3 — Test Configuration & Fixtures
Module: da3_mongodb/tests/conftest.py
"""

import os
import pytest
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
TEST_DB_NAME = os.getenv("TEST_DATABASE_NAME", "smartretail_test_db")

from da3_mongodb.scripts.setup_database import setup_database
from da3_mongodb.scripts.seed_data import seed_database
from da3_mongodb.src.database import DatabaseConnection
from da3_mongodb.src.services.sales_service import SalesService
from da3_mongodb.src.services.inventory_service import InventoryService
from da3_mongodb.src.services.procurement_service import ProcurementService
from da3_mongodb.src.services.workflow_service import WorkflowService


@pytest.fixture(scope="session")
def mongo_client():
    client = MongoClient(MONGODB_URI)
    yield client
    # Teardown test database at the end of testing
    client.drop_database(TEST_DB_NAME)
    client.close()


@pytest.fixture(scope="function")
def test_db(mongo_client):
    # Set up collections, validators, and indexes in test database
    setup_database(TEST_DB_NAME)
    # Seed standard test dataset
    seed_database(TEST_DB_NAME)
    db = mongo_client[TEST_DB_NAME]
    yield db


@pytest.fixture
def sales_service(test_db):
    return SalesService(test_db)


@pytest.fixture
def inventory_service(test_db):
    return InventoryService(test_db)


@pytest.fixture
def procurement_service(test_db):
    return ProcurementService(test_db)


@pytest.fixture
def workflow_service(test_db):
    return WorkflowService(test_db)
