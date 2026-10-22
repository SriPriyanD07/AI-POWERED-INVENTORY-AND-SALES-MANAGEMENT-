"""
SmartRetail DA3 — Master Demonstration Runner (CLI)
Module: da3_mongodb/src/main.py
"""

import os
import sys
from pathlib import Path

# Add project root to path
base_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(base_dir))

from da3_mongodb.scripts.seed_data import seed_database
from da3_mongodb.queries.business_queries import run_business_queries
from da3_mongodb.src.services.workflow_service import WorkflowService
from da3_mongodb.src.database import get_db


def main():
    print("=" * 80)
    print("SMARTRETAIL DBMS — DA3 MONGODB IMPLEMENTATION DEMONSTRATION")
    print("Student Reg No: 25BCE1074 | Course: Database Management Systems")
    print("=" * 80)

    db = get_db()
    print(f"Connected to MongoDB: {db.name}")

    print("\n[STEP 1] Resetting & Populating Sample Supermarket Dataset...")
    seed_database()

    print("\n[STEP 2] Executing Complete End-to-End Retail Workflow...")
    workflow_svc = WorkflowService(db)
    workflow_result = workflow_svc.run_end_to_end_demonstration()

    print(f"\nWorkflow Status: {workflow_result['workflow_status']}")
    for stage in workflow_result["stages"]:
        print(f"  [OK] {stage['stage']}: {stage['description']}")

    print("\n[STEP 3] Running 15 Canonical Business Queries on Updated State...")
    run_business_queries()

    print("\n" + "=" * 80)
    print("DEMONSTRATION COMPLETED SUCCESSFULLY!")
    print("To launch interactive FastAPI Swagger UI, run:")
    print("  uvicorn da3_mongodb.src.api:app --reload")
    print("=" * 80)


if __name__ == "__main__":
    main()
