"""
SmartRetail DA3 — Sales Service
Module: da3_mongodb/src/services/sales_service.py
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pymongo.database import Database
from da3_mongodb.src.database import get_db
from da3_mongodb.src.repositories.sales_repository import SalesRepository
from da3_mongodb.src.repositories.inventory_repository import InventoryRepository
from da3_mongodb.src.repositories.product_repository import ProductRepository
from da3_mongodb.src.repositories.customer_repository import CustomerRepository


class SalesService:
    def __init__(self, db: Optional[Database] = None):
        self.db = db if db is not None else get_db()
        self.sales_repo = SalesRepository(self.db)
        self.inventory_repo = InventoryRepository(self.db)
        self.product_repo = ProductRepository(self.db)
        self.customer_repo = CustomerRepository(self.db)

    def process_sale(
        self,
        receipt_number: str,
        cashier_id: int,
        items: List[Dict[str, Any]],
        payments: List[Dict[str, Any]],
        customer_id: Optional[int] = None
    ) -> Dict[str, Any]:
        # 1. Check idempotency: duplicate receipt rejection
        existing = self.sales_repo.get_by_receipt(receipt_number)
        if existing:
            raise ValueError(f"Duplicate Sale: Receipt number '{receipt_number}' has already been processed.")

        # 2. Customer validation (if registered customer provided)
        customer_name = "Guest Walk-In"
        if customer_id:
            cust = self.customer_repo.get_by_id(customer_id)
            if not cust:
                raise ValueError(f"Customer ID {customer_id} does not exist.")
            customer_name = f"{cust['first_name']} {cust['last_name']}"

        # 3. Validate items, locations, prices, and stock
        validated_items = []
        total_amount = 0.0
        stock_updates_to_revert = []

        try:
            for item in items:
                prod_id = item["product_id"]
                shelf_id = item["shelf_location_id"]
                qty = item["quantity"]

                # Validate product
                prod = self.product_repo.get_by_id(prod_id)
                if not prod:
                    raise ValueError(f"Product ID {prod_id} does not exist.")
                if str(prod.get("is_active")).upper() != "TRUE":
                    raise ValueError(f"Sale Rejected: Product '{prod['product_name']}' is discontinued/inactive.")

                # Validate shelf location
                loc = self.inventory_repo.get_location(shelf_id)
                if not loc:
                    raise ValueError(f"Location ID {shelf_id} does not exist.")
                if loc["location_type"] != "SHELF":
                    raise ValueError(f"Sale Rejected: Location '{loc['location_code']}' is not a retail SHELF.")

                # Price resolution
                unit_price = item.get("unit_price") or float(prod["standard_unit_price"])
                subtotal = round(qty * unit_price, 2)
                total_amount += subtotal

                # Atomic stock deduction
                updated_stock = self.inventory_repo.atomic_decrement_stock(shelf_id, prod_id, qty)
                if not updated_stock:
                    curr_stk = self.inventory_repo.get_stock(shelf_id, prod_id)
                    avail = curr_stk.get("quantity_on_hand", 0) if curr_stk else 0
                    raise ValueError(
                        f"Sale Rejected: Insufficient shelf stock for '{prod['product_name']}' at {loc['location_code']}. "
                        f"Available={avail}, Requested={qty}"
                    )

                stock_updates_to_revert.append((shelf_id, prod_id, qty))

                validated_items.append({
                    "product_id": prod_id,
                    "sku": prod["sku"],
                    "product_name": prod["product_name"],
                    "shelf_location_id": shelf_id,
                    "shelf_code": loc["location_code"],
                    "quantity_sold": qty,
                    "unit_price": unit_price,
                    "subtotal": subtotal,
                    "qoh_after": updated_stock["quantity_on_hand"],
                    "threshold": updated_stock.get("reorder_threshold", 10),
                    "reorder_qty": updated_stock.get("reorder_quantity", 20),
                    "parent_wh": loc.get("parent_location_id") or 1
                })

            total_amount = round(total_amount, 2)

            # 4. Validate payment settlement (total payments must match sale total)
            payment_sum = round(sum(p["amount"] for p in payments), 2)
            if abs(payment_sum - total_amount) > 0.01:
                raise ValueError(
                    f"Payment Mismatch: Total sale amount is Rs. {total_amount:.2f}, "
                    f"but total tender payments sum to Rs. {payment_sum:.2f}."
                )

            # 5. Prepare payments with payment_id, status, and timestamp
            now = datetime.now(timezone.utc)
            payment_start_id = self.sales_repo.payment_repo.count() + 1
            for idx, p in enumerate(payments):
                if "payment_id" not in p:
                    p["payment_id"] = payment_start_id + idx
                if "status" not in p:
                    p["status"] = "SUCCESS"
                if "payment_date" not in p:
                    p["payment_date"] = now

            sale_doc = {
                "receipt_number": receipt_number,
                "customer_id": customer_id,
                "customer_name": customer_name,
                "cashier_id": cashier_id,
                "transaction_date": now,
                "total_amount": total_amount,
                "status": "COMPLETED",
                "items": [
                    {k: v for k, v in itm.items() if k not in ["qoh_after", "threshold", "reorder_qty", "parent_wh"]}
                    for itm in validated_items
                ],
                "payments": payments
            }

            txn_id = self.sales_repo.insert_sales_transaction(sale_doc)

            # 6. Record dual projection in payments collection & audit ledger
            for p in payments:
                p["transaction_id"] = txn_id
                p["receipt_number"] = receipt_number
            self.sales_repo.insert_payments(payments)

            for itm in validated_items:
                self.inventory_repo.record_inventory_transaction(
                    product_id=itm["product_id"],
                    location_id=itm["shelf_location_id"],
                    txn_type="SALE",
                    quantity=-itm["quantity_sold"],
                    ref_type="SALE",
                    ref_id=txn_id
                )

                # Check if shelf stock breached threshold -> Trigger RestockEvent (Warehouse -> Shelf)
                if itm["qoh_after"] <= itm["threshold"]:
                    self.check_and_trigger_restock(
                        product_id=itm["product_id"],
                        product_name=itm["product_name"],
                        from_loc=itm["parent_wh"],
                        to_loc=itm["shelf_location_id"],
                        quantity=itm["reorder_qty"]
                    )

            # 7. Loyalty points reward (1 point per Rs. 100 spent)
            if customer_id:
                earned_points = int(total_amount // 100)
                if earned_points > 0:
                    self.customer_repo.update_loyalty_points(customer_id, earned_points)

            return {
                "success": True,
                "transaction_id": txn_id,
                "receipt_number": receipt_number,
                "total_amount": total_amount,
                "items_count": len(validated_items),
                "customer_name": customer_name,
                "status": "COMPLETED"
            }

        except Exception as e:
            # Compensating rollback: restore decremented stock if checkout fails downstream
            for shelf_id, prod_id, qty in stock_updates_to_revert:
                self.inventory_repo.atomic_increment_stock(shelf_id, prod_id, qty)
            raise e

    def check_and_trigger_restock(self, product_id: int, product_name: str, from_loc: int, to_loc: int, quantity: int) -> Optional[int]:
        """Checks if a PENDING restock event exists; if not, logs a new RestockEvent."""
        existing = self.inventory_repo.restock_repo.find_one({
            "product_id": product_id,
            "to_location_id": to_loc,
            "status": "PENDING"
        })
        if not existing:
            return self.inventory_repo.create_restock_event(
                product_id=product_id,
                product_name=product_name,
                from_loc=from_loc,
                to_loc=to_loc,
                quantity=quantity,
                triggered_by="AUTO_THRESHOLD",
                status="PENDING"
            )
        return None
