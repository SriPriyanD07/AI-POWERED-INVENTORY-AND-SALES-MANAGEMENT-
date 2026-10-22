"""
SmartRetail — Safe Data Migration: Local MongoDB -> MongoDB Atlas
Script: da3_mongodb/scripts/migrate_to_atlas.py
Description: Migrates existing operational collections from local MongoDB to MongoDB Atlas
             without overwriting or deleting any existing source data.
"""

import os
import re
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

base_dir = Path(__file__).resolve().parent.parent
load_dotenv(base_dir / ".env")

LOCAL_URI = "mongodb://localhost:27017/"
ATLAS_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smartretail_db")


def get_masked_uri(uri: str) -> str:
    if not uri:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", uri)


def migrate_to_atlas():
    print("=" * 80)
    print("SmartRetail — Cloud Migration to MongoDB Atlas")
    print("=" * 80)

    if not ATLAS_URI or "localhost" in ATLAS_URI:
        print("[ERROR] MONGODB_URI in .env is not configured for a remote Atlas cluster.")
        return False

    print(f"Source (Local): {LOCAL_URI}")
    print(f"Target (Atlas): {get_masked_uri(ATLAS_URI)}")
    print(f"Database:       {DATABASE_NAME}\n")

    # Connect to source and target
    try:
        local_client = MongoClient(LOCAL_URI, serverSelectionTimeoutMS=5000)
        local_client.admin.command("ping")
        local_db = local_client[DATABASE_NAME]
    except Exception as e:
        print(f"[ERROR] Unable to connect to local MongoDB at {LOCAL_URI}: {e}")
        return False

    try:
        atlas_client = MongoClient(ATLAS_URI, serverSelectionTimeoutMS=8000)
        atlas_client.admin.command("ping")
        atlas_db = atlas_client[DATABASE_NAME]
    except Exception as e:
        print(f"[ERROR] Unable to connect to MongoDB Atlas at {get_masked_uri(ATLAS_URI)}: {e}")
        return False

    collections = [
        "product_categories",
        "products",
        "inventory_locations",
        "inventory_stock",
        "suppliers",
        "customers",
        "employees",
        "purchase_orders",
        "shipments",
        "sales_transactions",
        "payments",
        "inventory_transactions",
        "restock_events",
        "reorder_triggers",
    ]

    print("Checking collection counts and migrating data...")
    print(f"{'Collection':<25} {'Local Count':<12} {'Atlas Count (Before)':<22} {'Status'}")
    print("-" * 75)

    total_migrated = 0

    for col in collections:
        local_count = local_db[col].count_documents({})
        atlas_count_before = atlas_db[col].count_documents({})

        if local_count == 0:
            print(f"{col:<25} {local_count:<12} {atlas_count_before:<22} SKIPPED (Empty local)")
            continue

        if atlas_count_before > 0:
            print(f"{col:<25} {local_count:<12} {atlas_count_before:<22} PRESERVED (Already exists on Atlas)")
            continue

        # Fetch documents from local
        docs = list(local_db[col].find({}))
        if docs:
            atlas_db[col].insert_many(docs, ordered=False)
            atlas_count_after = atlas_db[col].count_documents({})
            total_migrated += len(docs)
            print(f"{col:<25} {local_count:<12} {atlas_count_before:<22} MIGRATED ({atlas_count_after} docs)")

    print("-" * 75)
    print(f"[SUCCESS] Migration completed. Total documents copied: {total_migrated}")

    # Final parity check
    print("\nFinal Atlas Verification:")
    for col in collections:
        count = atlas_db[col].count_documents({})
        print(f"  - {col}: {count} documents")

    return True


if __name__ == "__main__":
    migrate_to_atlas()
