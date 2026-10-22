"""
SmartRetail DA3 — Workflow Resilience & Fault Tolerance Test Suite
Module: da3_mongodb/tests/test_workflow_resilience.py
Description: Validates end-to-end SmartRetail workflow resilience across repeated executions,
             shipment safety, non-negative inventory guarantees, prerequisite validation,
             idempotency, and API error contracts.
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from da3_mongodb.src.api import app
from da3_mongodb.src.services.workflow_service import WorkflowService


def test_first_execution_and_lifecycle(test_db, workflow_service):
    """Scenario A & D: Workflow executes complete 5-stage lifecycle and updates inventory ledger."""
    res = workflow_service.run_end_to_end_demonstration()

    assert res["workflow_status"] == "COMPLETED_SUCCESSFULLY"
    assert res["stages_executed"] == 5
    assert len(res["stages"]) == 5
    assert res["sale_total"] > 0
    assert res["shipment_id"] is not None
    assert res["generated_po_id"] is not None

    # Verify Stage 1: Shipment status in DB
    shipment = test_db.shipments.find_one({"shipment_id": res["shipment_id"]})
    assert shipment is not None
    assert shipment["status"] == "RECEIVED"
    assert shipment["received_date"] is not None

    # Verify Stage 3: Sales transaction
    sale = test_db.sales_transactions.find_one({"receipt_number": res["receipt_number"]})
    assert sale is not None
    assert sale["status"] == "COMPLETED"
    assert sale["total_amount"] == res["sale_total"]

    # Verify Stage 4 & 5: Inventory audit records
    receipt_txns = list(test_db.inventory_transactions.find({"transaction_type": "RECEIPT", "reference_id": res["shipment_id"]}))
    assert len(receipt_txns) >= 1

    sale_txns = list(test_db.inventory_transactions.find({"transaction_type": "SALE", "reference_id": sale["transaction_id"]}))
    assert len(sale_txns) >= 1


def test_repeated_workflow_execution_without_reset(test_db, workflow_service):
    """Scenario B & G: Running workflow multiple consecutive times on same database succeeds idempotently."""
    executed_shipment_ids = []
    executed_po_ids = []

    for i in range(1, 4):
        res = workflow_service.run_end_to_end_demonstration()
        assert res["workflow_status"] == "COMPLETED_SUCCESSFULLY", f"Run {i} failed: {res}"
        assert res["stages_executed"] == 5

        # Verify each execution received a fresh eligible shipment (never re-received an already received one)
        ship_id = res["shipment_id"]
        assert ship_id not in executed_shipment_ids, f"Shipment {ship_id} was reused across runs"
        executed_shipment_ids.append(ship_id)

        # Verify purchase orders are distinct
        po_id = res["generated_po_id"]
        assert po_id not in executed_po_ids, f"PO {po_id} was duplicated across runs"
        executed_po_ids.append(po_id)

    assert len(executed_shipment_ids) == 3
    assert len(executed_po_ids) == 3


def test_shipment_cannot_be_received_twice(test_db, procurement_service):
    """Scenario C: Shipment validation prevents receiving an already received shipment."""
    # Find any received shipment
    received_shipment = test_db.shipments.find_one({"status": "RECEIVED"})
    assert received_shipment is not None, "Expected at least one received shipment in seed data"

    with pytest.raises(ValueError, match="has already been received"):
        procurement_service.receive_shipment(
            shipment_id=received_shipment["shipment_id"],
            warehouse_location_id=1,
            received_by=5
        )


def test_stock_safety_no_negative_quantities(test_db, inventory_service, sales_service):
    """Scenario E: Inventory service and POS checkout reject deductions exceeding stock on hand."""
    # 1. Transfer rejection when requested quantity exceeds available stock
    with pytest.raises(ValueError, match="Insufficient stock at source"):
        inventory_service.transfer_stock(
            product_id=7,
            from_location_id=1,
            to_location_id=5,
            quantity=999999,
            employee_id=5
        )

    # 2. Sale rejection when requested shelf units exceed available shelf stock
    with pytest.raises(ValueError, match="Insufficient shelf stock"):
        sales_service.process_sale(
            receipt_number=f"RCP-FAIL-{int(datetime.now().timestamp() * 1000)}",
            cashier_id=2,
            customer_id=1,
            items=[{"product_id": 7, "shelf_location_id": 5, "quantity": 999999, "unit_price": 120.0}],
            payments=[{"payment_method": "CASH", "amount": 999999 * 120.0}]
        )


def test_missing_prerequisites_error_reporting(test_db):
    """Scenario F: Missing critical prerequisites raises explicit actionable ValueError."""
    # Create isolated workflow service instance on modified test db
    test_db.inventory_locations.delete_many({"location_type": "WAREHOUSE"})

    wf = WorkflowService(test_db)
    with pytest.raises(ValueError, match="Workflow Prerequisite Missing: No warehouse location"):
        wf.run_end_to_end_demonstration()


def test_partial_failure_compensation(test_db, sales_service, inventory_service):
    """Scenario H: Downstream sale failures revert decremented shelf stock."""
    shelf_loc = test_db.inventory_locations.find_one({"location_type": "SHELF"})
    shelf_id = shelf_loc["location_id"]
    prod = test_db.products.find_one({"is_active": "TRUE"})
    prod_id = prod["product_id"]

    # Ensure baseline shelf stock
    inventory_service.inventory_repo.atomic_increment_stock(shelf_id, prod_id, 10)
    initial_stock = inventory_service.inventory_repo.get_stock(shelf_id, prod_id)["quantity_on_hand"]

    # Attempt sale with payment mismatch (downstream validation failure)
    with pytest.raises(ValueError, match="Payment Mismatch"):
        sales_service.process_sale(
            receipt_number=f"RCP-ROLLBACK-{int(datetime.now().timestamp() * 1000)}",
            cashier_id=2,
            customer_id=1,
            items=[{"product_id": prod_id, "shelf_location_id": shelf_id, "quantity": 2, "unit_price": 50.0}],
            payments=[{"payment_method": "CASH", "amount": 999.0}]  # 999 != 100
        )

    # Verify shelf stock was compensated and not decremented
    stock_after = inventory_service.inventory_repo.get_stock(shelf_id, prod_id)["quantity_on_hand"]
    assert stock_after == initial_stock


def test_workflow_api_status_codes_and_responses(test_db):
    """Scenario I: FastAPI endpoint returns HTTP 200 with structured JSON and handles business errors."""
    import da3_mongodb.src.api as api_mod
    original_svc = api_mod.workflow_svc
    api_mod.workflow_svc = WorkflowService(test_db)

    try:
        client = TestClient(api_mod.app)

        # 1. Success case
        response = client.post("/workflow/demonstrate")
        assert response.status_code == 200
        data = response.json()
        assert data["workflow_status"] == "COMPLETED_SUCCESSFULLY"
        assert data["stages_executed"] == 5
        assert "sale_total" in data
        assert "generated_po_id" in data
        assert "shipment_id" in data

        # 2. Repeated call succeeds without error
        response2 = client.post("/workflow/demonstrate")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["workflow_status"] == "COMPLETED_SUCCESSFULLY"

        # 3. Business rule rejection returns structured HTTP 400 (not unhandled 500)
        test_db.inventory_locations.delete_many({"location_type": "WAREHOUSE"})
        err_response = client.post("/workflow/demonstrate")
        assert err_response.status_code == 400
        assert "Workflow Prerequisite Missing" in err_response.json()["detail"]
    finally:
        api_mod.workflow_svc = original_svc
