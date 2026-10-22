"""
SmartRetail DA3 — Workflow & Inventory Tests
Module: da3_mongodb/tests/test_workflow_inventory.py
"""

import pytest
from datetime import datetime


def test_stock_transfer_between_locations(test_db, inventory_service):
    """Test 11: Transfer stock from Warehouse to Shelf."""
    # Transfer 10 units of Bread (Product 4) from WH 1 (120 units) to Shelf 4 (25 units)
    res = inventory_service.transfer_stock(
        product_id=4,
        from_location_id=1,
        to_location_id=4,
        quantity=10,
        employee_id=5,
        triggered_by="TEST_RESTOCK"
    )
    assert res["success"] is True
    assert res["source_qoh_after"] == 110
    assert res["destination_qoh_after"] == 35

    # Verify RestockEvent logged
    restock = test_db.restock_events.find_one({"restock_id": res["restock_id"]})
    assert restock is not None
    assert restock["quantity_moved"] == 10
    assert restock["status"] == "COMPLETED"

    # Verify dual audit ledger entries
    txns = list(test_db.inventory_transactions.find({"reference_id": res["restock_id"]}))
    assert len(txns) == 2
    types = [t["transaction_type"] for t in txns]
    assert "TRANSFER_OUT" in types
    assert "TRANSFER_IN" in types


def test_transfer_rejections(test_db, inventory_service):
    """Test 12: Rejection of invalid transfer requests."""
    # 1. Identical source and destination
    with pytest.raises(ValueError, match="cannot be identical"):
        inventory_service.transfer_stock(product_id=4, from_location_id=1, to_location_id=1, quantity=10)

    # 2. Insufficient stock at source
    with pytest.raises(ValueError, match="Insufficient stock at source"):
        inventory_service.transfer_stock(product_id=4, from_location_id=1, to_location_id=4, quantity=9999)


def test_shipment_receipt_and_replenishment(test_db, procurement_service):
    """Test 13: Receiving an inbound shipment into warehouse increments stock and completes PO."""
    # Shipment 3 is IN_TRANSIT with 100 units of Product 7, 100 units of Product 8, 20 units of Product 9
    initial_stk_p7 = test_db.inventory_stock.find_one({"location_id": 1, "product_id": 7})["quantity_on_hand"]

    res = procurement_service.receive_shipment(
        shipment_id=3,
        warehouse_location_id=1,
        received_by=5
    )
    assert res["success"] is True
    assert res["status"] == "RECEIVED"

    # Verify warehouse stock increased by 100
    updated_stk_p7 = test_db.inventory_stock.find_one({"location_id": 1, "product_id": 7})["quantity_on_hand"]
    assert updated_stk_p7 == initial_stk_p7 + 100

    # Verify PO 3 status updated to COMPLETED
    po = test_db.purchase_orders.find_one({"po_id": 3})
    assert po["status"] == "COMPLETED"

    # Verify shipment cannot be received twice
    with pytest.raises(ValueError, match="already been received"):
        procurement_service.receive_shipment(shipment_id=3, warehouse_location_id=1, received_by=5)


def test_purchase_order_creation_and_reorder_trigger(test_db, procurement_service):
    """Test 14: Creating purchase orders manually and resolving reorder triggers."""
    po_num = f"PO-TEST-{int(datetime.now().timestamp())}"
    res = procurement_service.create_purchase_order(
        po_number=po_num,
        supplier_id=1,
        created_by=4,
        items=[{"product_id": 1, "quantity_ordered": 200, "unit_price": 50.00}],
        is_auto_generated=True,
        trigger_id=1
    )
    assert res["success"] is True
    assert res["total_amount"] == 10000.00

    # Verify trigger updated
    trig = test_db.reorder_triggers.find_one({"trigger_id": 1})
    assert trig["status"] == "PO_CREATED"
    assert trig["generated_po_id"] == res["po_id"]


def test_end_to_end_workflow(test_db, workflow_service):
    """Test 15: Execute complete retail cycle through WorkflowService."""
    res = workflow_service.run_end_to_end_demonstration()
    assert res["workflow_status"] == "COMPLETED_SUCCESSFULLY"
    assert res["stages_executed"] == 5
