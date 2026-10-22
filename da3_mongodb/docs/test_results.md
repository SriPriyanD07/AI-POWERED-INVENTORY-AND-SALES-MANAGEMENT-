# SmartRetail DA3 — Automated Test Results & Verification Log

**Date of Execution:** October 2026  
**Test Framework:** `pytest 9.1.1` with `pytest-asyncio 1.4.0`  
**Python Runtime:** Python 3.13.0 on Windows (x86_64)  
**Database Engine:** MongoDB Server 8.2.3 (Community Edition)  
**Target Database:** `smartretail_test_db` (Isolated Test Environment)  

---

## 1. Test Execution Summary

| Total Test Cases | Passed | Failed | Skipped | Total Execution Time |
|---|---|---|---|---|
| **17** | **17** | **0** | **0** | **2.70 seconds** |

```
platform win32 -- Python 3.13.0, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\PROJECTS\DBMS
collected 17 items

da3_mongodb/tests/test_aggregations.py::test_revenue_by_category_aggregation PASSED [  5%]
da3_mongodb/tests/test_aggregations.py::test_receipt_lookup_join PASSED             [ 11%]
da3_mongodb/tests/test_aggregations.py::test_enterprise_stock_valuation PASSED        [ 17%]
da3_mongodb/tests/test_sales_and_stock.py::test_inventory_decrement_after_sale PASSED [ 23%]
da3_mongodb/tests/test_sales_and_stock.py::test_rejection_of_sale_exceeding_stock PASSED [ 29%]
da3_mongodb/tests/test_sales_and_stock.py::test_payment_split_and_association PASSED  [ 35%]
da3_mongodb/tests/test_sales_and_stock.py::test_duplicate_receipt_rejection PASSED    [ 41%]
da3_mongodb/tests/test_sales_and_stock.py::test_referential_consistency_checks PASSED [ 47%]
da3_mongodb/tests/test_validators_indexes.py::test_successful_insertion_and_retrieval PASSED [ 52%]
da3_mongodb/tests/test_validators_indexes.py::test_product_updates PASSED             [ 58%]
da3_mongodb/tests/test_validators_indexes.py::test_unique_index_enforcement PASSED    [ 64%]
da3_mongodb/tests/test_validators_indexes.py::test_schema_validation_rejection PASSED [ 70%]
da3_mongodb/tests/test_workflow_inventory.py::test_stock_transfer_between_locations PASSED [ 76%]
da3_mongodb/tests/test_workflow_inventory.py::test_transfer_rejections PASSED        [ 82%]
da3_mongodb/tests/test_workflow_inventory.py::test_shipment_receipt_and_replenishment PASSED [ 88%]
da3_mongodb/tests/test_workflow_inventory.py::test_purchase_order_creation_and_reorder_trigger PASSED [ 94%]
da3_mongodb/tests/test_workflow_inventory.py::test_end_to_end_workflow PASSED        [100%]

============================= 17 passed in 2.70s ==============================
```

---

## 2. Detailed Test Case Specification & Verification Log

### Test Suite A: Validators & Indexes (`test_validators_indexes.py`)

#### Test 1: Successful Insertion and Retrieval
- **Target:** `customers` collection.
- **Scenario:** Inserts a valid customer document with embedded phone numbers array and retrieves it by `customer_id`.
- **Pass Criteria:** Inserted document returned with intact email, phone numbers array, and loyalty points.
- **Result:** `PASSED`.

#### Test 2: Product Updates
- **Target:** `products` collection.
- **Scenario:** Updates `standard_unit_price` and description for Product 1.
- **Pass Criteria:** `matched_count == 1`, `modified_count == 1`, updated price reflected on read.
- **Result:** `PASSED`.

#### Test 3: Unique Index Enforcement
- **Target:** `customers.email`, `products.sku`, and compound `{ location_id: 1, product_id: 1 }` on `inventory_stock`.
- **Scenario:** Attempts inserting duplicate keys across all three index targets.
- **Pass Criteria:** Driver raises `pymongo.errors.DuplicateKeyError` (error code 11000) on each duplicate attempt.
- **Result:** `PASSED`.

#### Test 4: Schema Validation Rejection
- **Target:** MongoDB JSON Schema Validators.
- **Scenario:** 
  1. Inserts customer with malformed email (`"not-an-email"`).
  2. Inserts product with negative unit price (`-15.00`).
  3. Inserts employee with disallowed role (`"CEO_FOUNDER"`).
- **Pass Criteria:** Engine raises `pymongo.errors.WriteError` (error code 121: `Document failed validation`).
- **Result:** `PASSED`.

---

### Test Suite B: Sales, Stock & Payments (`test_sales_and_stock.py`)

#### Test 5: Inventory Decrement After Sale
- **Target:** `sales_service.process_sale` & `inventory_stock`.
- **Scenario:** Customer purchases 2 units of Milk from Shelf 3 (`quantity_on_hand` initially 8).
- **Pass Criteria:** Shelf stock decrements to exactly 6 units; audit transaction record logged in `inventory_transactions` with `quantity = -2` and `transaction_type = 'SALE'`.
- **Result:** `PASSED`.

#### Test 6: Rejection of Sale Exceeding Stock (Overdraft Prevention)
- **Target:** `sales_service.process_sale` atomic conditional update.
- **Scenario:** Attempts to purchase 999 units of Milk from Shelf 3 (available = 8).
- **Pass Criteria:** Raises `ValueError("Insufficient shelf stock")`; live inventory quantity remains unaltered at 8 units.
- **Result:** `PASSED`.

#### Test 7: Split Payment Tender Settlement & Association
- **Target:** `sales_transactions.payments` & `payments` collection.
- **Scenario:** Customer purchases 2 loaves of Bread (Rs. 100.00 total) settling via split tender: Rs. 60.00 Cash + Rs. 40.00 UPI.
- **Pass Criteria:** Transaction completes; exactly 2 payment documents created in `payments` collection totaling Rs. 100.00.
- **Result:** `PASSED`.

#### Test 8: Duplicate Receipt Rejection (Idempotency)
- **Target:** `sales_service.process_sale`.
- **Scenario:** Submits the same receipt number twice.
- **Pass Criteria:** Second submission is rejected with `ValueError("Duplicate Sale")`.
- **Result:** `PASSED`.

#### Test 9: Referential Consistency Checks
- **Target:** Business validation logic.
- **Scenario:** 
  1. Sale dispensed from Warehouse (Location 1) instead of Shelf.
  2. Sale of inactive/discontinued product.
- **Pass Criteria:** Both operations rejected with appropriate descriptive business exceptions.
- **Result:** `PASSED`.

---

### Test Suite C: Workflow & Inventory Movements (`test_workflow_inventory.py`)

#### Test 10: Stock Transfer Between Locations (Warehouse → Shelf)
- **Target:** `inventory_service.transfer_stock`.
- **Scenario:** Transfers 10 units of Bread from Central Warehouse (120 units) to Shelf 4 (25 units).
- **Pass Criteria:** Source stock decrements to 110; destination stock increments to 35; `RestockEvent` created with status `COMPLETED`; dual audit entries (`TRANSFER_OUT` and `TRANSFER_IN`) logged.
- **Result:** `PASSED`.

#### Test 11: Transfer Rejection Scenarios
- **Target:** Defensive transfer validation.
- **Scenario:** Identical source/destination transfer and transfer exceeding available warehouse quantity.
- **Pass Criteria:** Both calls rejected with descriptive errors; zero balance corruption.
- **Result:** `PASSED`.

#### Test 12: Shipment Receipt & Warehouse Replenishment
- **Target:** `procurement_service.receive_shipment`.
- **Scenario:** Inbound Shipment 3 received into Central Warehouse.
- **Pass Criteria:** Target warehouse stock increments by shipped quantity; shipment status becomes `RECEIVED`; parent purchase order becomes `COMPLETED`; second receipt attempt is rejected.
- **Result:** `PASSED`.

#### Test 13: Purchase Order Creation & Reorder Trigger Status
- **Target:** `procurement_service.create_purchase_order`.
- **Scenario:** Generates procurement PO linked to active reorder trigger.
- **Pass Criteria:** Purchase order created with computed total; reorder trigger status transitions from `OPEN` to `PO_CREATED` with `generated_po_id`.
- **Result:** `PASSED`.

#### Test 14: End-to-End Workflow Execution
- **Target:** `workflow_service.run_end_to_end_demonstration`.
- **Scenario:** Executes the entire 5-stage retail lifecycle consecutively.
- **Pass Criteria:** All 5 stages complete with `workflow_status == 'COMPLETED_SUCCESSFULLY'`.
- **Result:** `PASSED`.

---

### Test Suite D: Aggregations & Joins (`test_aggregations.py`)

#### Test 15: Revenue by Category Aggregation Pipeline
- **Target:** MongoDB Aggregation Pipeline (`$match`, `$unwind`, `$lookup`, `$group`).
- **Scenario:** Calculates aggregate revenue across merchandise categories for completed sales.
- **Pass Criteria:** Aggregation sum equals total historical sales revenue (Rs. 1,708.00).
- **Result:** `PASSED`.

#### Test 16: Multi-Collection `$lookup` Receipt Reconstruction
- **Target:** `$lookup` join stages on `sales_transactions`.
- **Scenario:** Reconstructs full receipt including customer demographics, cashier attribution, item lines, and split payments.
- **Pass Criteria:** Joined document correctly resolves foreign identifiers without application-side manual looping.
- **Result:** `PASSED`.

#### Test 17: Enterprise Stock Valuation Aggregation
- **Target:** `$lookup` + `$multiply` on `inventory_stock` and `products`.
- **Scenario:** Computes total physical stock holdings and monetary inventory valuation across all locations.
- **Pass Criteria:** Total physical units = 783; total valuation = Rs. 117,242.00.
- **Result:** `PASSED`.
