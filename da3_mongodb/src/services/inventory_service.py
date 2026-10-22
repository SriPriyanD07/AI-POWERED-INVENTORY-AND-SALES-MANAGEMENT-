"""
SmartRetail DA3 — Inventory Service
Module: da3_mongodb/src/services/inventory_service.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo.database import Database
from da3_mongodb.src.database import get_db, managed_transaction
from da3_mongodb.src.repositories.inventory_repository import InventoryRepository
from da3_mongodb.src.repositories.product_repository import ProductRepository


class InventoryService:
    def __init__(self, db: Optional[Database] = None):
        self.db = db if db is not None else get_db()
        self.inventory_repo = InventoryRepository(self.db)
        self.product_repo = ProductRepository(self.db)

    def transfer_stock(
        self,
        product_id: int,
        from_location_id: int,
        to_location_id: int,
        quantity: int,
        employee_id: Optional[int] = None,
        triggered_by: str = "MANUAL_REQUEST"
    ) -> Dict[str, Any]:
        if from_location_id == to_location_id:
            raise ValueError("Transfer Error: Source and destination locations cannot be identical.")

        if quantity <= 0:
            raise ValueError("Transfer Error: Quantity must be strictly greater than 0.")

        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError(f"Product ID {product_id} does not exist.")

        from_loc = self.inventory_repo.get_location(from_location_id)
        to_loc = self.inventory_repo.get_location(to_location_id)
        if not from_loc:
            raise ValueError(f"Source location ID {from_location_id} does not exist.")
        if not to_loc:
            raise ValueError(f"Destination location ID {to_location_id} does not exist.")

        # Atomic decrement at source
        updated_source = self.inventory_repo.atomic_decrement_stock(from_location_id, product_id, quantity)
        if not updated_source:
            # Check current stock for informative error message
            current_stock = self.inventory_repo.get_stock(from_location_id, product_id)
            available = current_stock.get("quantity_on_hand", 0) if current_stock else 0
            raise ValueError(
                f"Transfer Rejected: Insufficient stock at source location {from_loc['location_code']}. "
                f"Available={available}, Requested={quantity}"
            )

        try:
            # Increment destination stock
            updated_dest = self.inventory_repo.atomic_increment_stock(to_location_id, product_id, quantity)

            # Create restock event
            restock_id = self.inventory_repo.create_restock_event(
                product_id=product_id,
                product_name=product["product_name"],
                from_loc=from_location_id,
                to_loc=to_location_id,
                quantity=quantity,
                triggered_by=triggered_by,
                performed_by=employee_id,
                status="COMPLETED"
            )

            # Record audit ledger entries: TRANSFER_OUT and TRANSFER_IN
            self.inventory_repo.record_inventory_transaction(
                product_id=product_id,
                location_id=from_location_id,
                txn_type="TRANSFER_OUT",
                quantity=-quantity,
                ref_type="RESTOCK",
                ref_id=restock_id
            )
            self.inventory_repo.record_inventory_transaction(
                product_id=product_id,
                location_id=to_location_id,
                txn_type="TRANSFER_IN",
                quantity=quantity,
                ref_type="RESTOCK",
                ref_id=restock_id
            )

            # Check if source warehouse breached safety threshold
            if from_loc["location_type"] == "WAREHOUSE":
                qoh_after = updated_source["quantity_on_hand"]
                thresh = updated_source.get("reorder_threshold", 20)
                if qoh_after <= thresh:
                    self.check_and_trigger_reorder(product_id, product["product_name"], from_location_id, qoh_after, thresh)

            return {
                "success": True,
                "restock_id": restock_id,
                "product_id": product_id,
                "product_name": product["product_name"],
                "quantity_transferred": quantity,
                "from_location": from_loc["location_code"],
                "to_location": to_loc["location_code"],
                "source_qoh_after": updated_source["quantity_on_hand"],
                "destination_qoh_after": updated_dest["quantity_on_hand"]
            }

        except Exception as e:
            # Compensating action if downstream recording fails
            self.inventory_repo.atomic_increment_stock(from_location_id, product_id, quantity)
            raise RuntimeError(f"Transfer failed and compensated: {str(e)}")

    def check_and_trigger_reorder(self, product_id: int, product_name: str, location_id: int, stock_at_trigger: int, threshold_at_trigger: int) -> Optional[int]:
        """Checks if an OPEN reorder trigger already exists; if not, logs a new trigger."""
        existing = self.inventory_repo.reorder_repo.find_one({
            "product_id": product_id,
            "location_id": location_id,
            "status": "OPEN"
        })
        if not existing:
            return self.inventory_repo.create_reorder_trigger(
                product_id=product_id,
                product_name=product_name,
                location_id=location_id,
                stock_at_trigger=stock_at_trigger,
                threshold_at_trigger=threshold_at_trigger,
                status="OPEN"
            )
        return None
