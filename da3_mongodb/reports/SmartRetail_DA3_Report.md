# SMARTRETAIL: AI-POWERED INVENTORY AND SALES MANAGEMENT SYSTEM
## Digital Assignment 3 (DA3) — Academic Project Submission Report
### Implementation of SmartRetail Enterprise Database Using MongoDB

---

**Course Title:** Database Management Systems (DBMS)  
**Deliverable:** Digital Assignment 3 (DA3) — Non-Relational / Document DBMS Implementation  
**Student Registration Number:** 25BCE1074  
**Student Name:** [Student Name]  
**Academic Year:** 2025–2026  
**Faculty Guide:** [Faculty Name]  
**Target Database:** MongoDB 8.2 (Community Edition)  
**Host Environment:** Windows x86_64 | Python 3.13 | PyMongo 4.19 | FastAPI  

---

## 2. Abstract

The modern supermarket enterprise demands high-throughput transactional processing, millisecond-latency point-of-sale (POS) settlement, real-time inventory synchronization across multi-tier storage facilities (central warehouses and retail display shelves), and flexible merchandise catalogs. While Digital Assignment 2 (DA2) successfully established an enterprise-grade, Boyce-Codd Normal Form (BCNF) relational database using Oracle Database 11g Express Edition, high-volume retail environments often experience write contention and multi-table join latency when querying deeply nested receipts and order lines.

This project delivers **Digital Assignment 3 (DA3)** by extending the SmartRetail DBMS into a document-oriented database using **MongoDB 8.2**. The completed Oracle 11g relational architecture is rigorously preserved while the approved 19 relations are systematically transformed into an optimized 14-collection document model. By leveraging document embedding for child order lines, shipment items, and split-tender payment allocations, and utilizing native arrays for multivalued contact attributes, the MongoDB implementation eliminates relational join penalties during checkout. Concurrency control and negative-stock prevention are guaranteed via atomic conditional mutations (`$inc` and `$gte`), while schema integrity is maintained through strict **MongoDB JSON Schema Validation** and compound unique indexes. An end-to-end retail workflow, a 17-part automated test suite, 15 canonical business queries, and a production-ready REST API with FastAPI are demonstrated. Finally, a comprehensive comparative analysis between Oracle 11g XE and MongoDB 8.2 evaluates the trade-offs between normalized relational rigor and document-oriented performance.

---

## 3. Introduction

Supermarket retail operations require continuous data synchronization across disparate commercial nodes: supplier procurement, inbound freight logistics, warehouse receiving, retail shelf display stocking, cashier-assisted point-of-sale checkout, customer loyalty rewards, and financial tender settlements. 

The primary business challenge in retail inventory management is the **Out-of-Stock (OOS)** and **Overstock** dilemma. Display shelves must be replenished before stockouts occur, while central warehouses must trigger procurement before safety thresholds are breached. In DA2, this was accomplished using Oracle PL/SQL triggers (`TRG_STOCK_THRESHOLD_ALERT`), sequences, and stored procedures (`PROCESS_SALE`, `RECEIVE_SHIPMENT`, `TRANSFER_STOCK`).

For DA3, faculty explicitly approved MongoDB as the non-relational database technology. MongoDB's BSON document paradigm enables storing complex, multi-layered business entities—such as a sales transaction containing both itemized line items and multiple payment methods—as cohesive, self-contained documents. This implementation demonstrates how to re-engineer an enterprise relational model into an idiomatic NoSQL architecture without compromising business rules or transactional consistency.

---

## 4. Existing SmartRetail System (DA2 Summary)

The existing SmartRetail project operates as a normalized relational database in Oracle Database 11g XE. It implements 19 approved relations adhering to BCNF principles:
1. `Supplier` (Vendor registry with GST, address, and ratings)
2. `SupplierPhone` (1NF multivalued vendor phone numbers)
3. `ProductCategory` (Hierarchical merchandise category tree)
4. `Product` (Master catalog with SKU, barcode, and standard unit price)
5. `Employee` (Store personnel directory across 5 distinct roles)
6. `PurchaseOrder` (Procurement order headers)
7. `PurchaseOrderLine` (Itemized order quantities and contracted prices)
8. `Shipment` (Inbound freight tracking and carrier details)
9. `ShipmentLine` (Receiving reconciliation comparing shipped vs. received quantities)
10. `InventoryLocation` (Physical facility layout: WAREHOUSE vs. SHELF)
11. `InventoryStock` (Live product stock snapshot per location with reorder thresholds)
12. `InventoryTransaction` (Immutable audit ledger recording every stock delta)
13. `RestockEvent` (Internal warehouse-to-shelf replenishment movements)
14. `ReorderTrigger` (External supplier replenishment alerts)
15. `Customer` (Customer loyalty registry and tier profiles)
16. `CustomerPhone` (1NF multivalued customer phone numbers)
17. `SalesTransaction` (POS receipt headers)
18. `SalesTransactionLine` (Itemized sold products and shelf attribution)
19. `Payment` (Split-tender payment records supporting Cash, Card, UPI, Wallet)

All existing Oracle SQL scripts, sequence definitions, PL/SQL procedures, views, triggers, and evidence documents located in `sql/`, `docs/`, and `output/` remain completely intact and unmodified.

---

## 5. Objectives of DA3

The primary objectives of Digital Assignment 3 are:
1. **Extend, Not Replace:** Preserve the completed Oracle DA2 implementation while creating a dedicated, self-contained MongoDB implementation in `da3_mongodb/`.
2. **Idiomatic Document Modeling:** Intelligently map all 19 relational entities into MongoDB collections using embedding, referencing, and native arrays based on access patterns and cardinality.
3. **Data Integrity Enforcement:** Replicate relational constraints (NOT NULL, UNIQUE, CHECK, FOREIGN KEY) using **MongoDB JSON Schema Validation** and compound unique indexes.
4. **Business Workflow Implementation:** Realize the complete retail lifecycle (Supplier → Shipment → Warehouse → Shelf → POS Sale → Auto-Restock → PO Reorder) using PyMongo operations.
5. **Atomic Concurrency Control:** Prevent negative stock and race conditions using single-document atomic operations (`find_one_and_update` with `$gte` and `$inc`) and compensating sagas.
6. **Query & Aggregation Suite:** Implement executable CRUD operations, complex aggregation pipelines (`$match`, `$group`, `$unwind`, `$lookup`), and the 15 canonical business queries.
7. **Automated Testing:** Deliver an automated pytest test suite verifying schema validation, unique indexes, overdraft prevention, split payments, and workflow orchestration.
8. **Comparative Analysis:** Provide a formal academic evaluation comparing Oracle Database 11g XE and MongoDB 8.2 across 12 architectural criteria.

---

## 6. Justification for Selecting MongoDB

MongoDB was selected for DA3 based on the following technical justifications:
1. **Locality of Reference for POS Receipts:** A supermarket POS checkout is inherently document-centric. A customer receipt consists of header metadata, line items, and split-tender payment splits. In MongoDB, reading and writing an entire receipt occurs in a single I/O operation against one collection (`sales_transactions`).
2. **Elimination of Weak Entity Joins:** Relational First Normal Form (1NF) disallows multivalued attributes, forcing phone numbers into separate tables (`CustomerPhone`, `SupplierPhone`). MongoDB natively supports BSON arrays of strings (`phone_numbers: ["..."]`), eliminating join overhead.
3. **Dynamic Catalog Attributes:** Supermarket merchandise spans diverse categories (dairy, produce, packaged beverages, electronics). MongoDB's polymorphic document structure allows adding product attributes (expiry dates, nutritional facts, storage temperature) without executing disruptive DDL table alters.
4. **Native Aggregation Pipelines:** Complex analytical workloads (daily revenue totals, category-level sales, inventory valuation) are executed via in-memory streaming aggregation pipelines that outperform multi-table SQL group-by queries.
5. **Horizontal Scalability:** While Oracle 11g XE is constrained to a single vertical instance, MongoDB supports native replica sets for sub-second failover and sharding for horizontal scale-out.

---

## 7. Existing Oracle Architecture

In DA2, the database architecture strictly segregated data across 19 tables linked by foreign keys with primary key surrogates generated by Oracle sequences (`SEQ_PRODUCT_ID.NEXTVAL`). Business rules were enforced procedurally inside the database engine:
- `PROCESS_SALE`: Executed row-level locking (`SELECT ... FOR UPDATE`), decremented shelf stock, inserted sales lines, updated receipt headers, and logged `SALE` transactions.
- `TRG_STOCK_THRESHOLD_ALERT`: A database trigger that evaluated `quantity_on_hand <= reorder_threshold` on every stock update, generating a `RestockEvent` for shelves or a `ReorderTrigger` for warehouses.
- `TRG_SALE_LINE_TOTAL_SYNC` & `TRG_PO_LINE_TOTAL_SYNC`: Triggers that synchronized header monetary totals on line insertions.

---

## 8. MongoDB Architecture

In DA3, the architecture is redesigned as a modular, decoupled system:
- **Storage Layer (MongoDB 8.2):** Consists of 14 optimized collections governed by JSON Schema Validators and B-Tree/Compound indexes.
- **Data Access Layer (`da3_mongodb/src/repositories/`):** Encapsulates CRUD operations, atomic conditional updates, and aggregation queries.
- **Service Layer (`da3_mongodb/src/services/`):** Enforces business logic, stock sufficiency validation, automated threshold evaluation, and compensating saga rollbacks.
- **API & Presentation Layer (`da3_mongodb/src/api.py`):** Exposes asynchronous REST endpoints with interactive Swagger UI documentation.

---

## 9. Oracle-to-MongoDB Data Model Mapping

| # | Oracle Relation (DA2) | MongoDB Collection (DA3) | Mapping Strategy | Unique Identifier | Relationship Handling |
|---|---|---|---|---|---|
| 1 | `Customer` | `customers` | Separate Collection | `customer_id` (Unique Int) | Referenced by `sales_transactions.customer_id` |
| 2 | `CustomerPhone` | `customers.phone_numbers` | Embedded Array of Strings | Composite PK in SQL | Embedded inside `customers` |
| 3 | `Employee` | `employees` | Separate Collection | `employee_id` (Unique Int) | Referenced by sales, POs, shipments |
| 4 | `ProductCategory` | `product_categories` | Separate Collection | `category_id` (Unique Int) | `parent_category_id` + `category_path` |
| 5 | `Product` | `products` | Separate Collection | `product_id`, `sku`, `barcode` | References `category_id`; embeds `category_name` |
| 6 | `Supplier` | `suppliers` | Separate Collection | `supplier_id`, `gst_number` | Referenced by `purchase_orders.supplier_id` |
| 7 | `SupplierPhone` | `suppliers.phone_numbers` | Embedded Array of Strings | Composite PK in SQL | Embedded inside `suppliers` |
| 8 | `InventoryLocation` | `inventory_locations` | Separate Collection | `location_id`, `location_code` | Hierarchical `parent_location_id` |
| 9 | `InventoryStock` | `inventory_stock` | Separate Collection | Compound `{ location_id, product_id }` | High-frequency update ledger |
| 10 | `InventoryTransaction` | `inventory_transactions` | Separate Collection | `transaction_id` (Unique Int) | Immutable audit log of stock movements |
| 11 | `PurchaseOrder` | `purchase_orders` | Separate Collection | `po_id`, `po_number` | Procurement order header |
| 12 | `PurchaseOrderLine` | `purchase_orders.items` | Embedded Array of Objects | Composite PK in SQL | Embedded within `purchase_orders` |
| 13 | `Shipment` | `shipments` | Separate Collection | `shipment_id`, `tracking_number` | Inbound carrier shipment header |
| 14 | `ShipmentLine` | `shipments.items` | Embedded Array of Objects | Composite PK in SQL | Embedded within `shipments` |
| 15 | `SalesTransaction` | `sales_transactions` | Separate Collection | `transaction_id`, `receipt_number` | POS receipt header |
| 16 | `SalesTransactionLine` | `sales_transactions.items` | Embedded Array of Objects | Composite PK in SQL | Embedded within `sales_transactions` |
| 17 | `Payment` | `sales_transactions.payments` & `payments` | Dual Projection (Embedded & Collection) | `payment_id` (Unique Int) | Embedded for atomic POS; mirrored for audit |
| 18 | `RestockEvent` | `restock_events` | Separate Collection | `restock_id` (Unique Int) | Warehouse-to-shelf movement tracker |
| 19 | `ReorderTrigger` | `reorder_triggers` | Separate Collection | `trigger_id` (Unique Int) | Supplier replenishment alert tracker |

---

## 10. MongoDB Document Schema Design

The document schemas are defined with strict typing, required fields, and domain boundaries. Below are representative JSON document schemas:

### A. Sales Transaction Document (Embedding Lines & Split Payments)
```json
{
  "_id": ObjectId("6ada16f898bae078ccabfb47"),
  "transaction_id": 1,
  "receipt_number": "RCP-2026-0001",
  "customer_id": 1,
  "customer_name": "Aditya Verma",
  "cashier_id": 2,
  "transaction_date": ISODate("2026-02-15T10:30:00Z"),
  "total_amount": 403.00,
  "status": "COMPLETED",
  "items": [
    {
      "product_id": 1,
      "sku": "SKU-DRY-001",
      "product_name": "Heritage Full Cream Milk 1L",
      "shelf_location_id": 3,
      "shelf_code": "SH-DAIRY-01",
      "quantity_sold": 2,
      "unit_price": 64.00,
      "subtotal": 128.00
    },
    {
      "product_id": 2,
      "sku": "SKU-DRY-002",
      "product_name": "Amul Salted Butter 500g",
      "shelf_location_id": 3,
      "shelf_code": "SH-DAIRY-01",
      "quantity_sold": 1,
      "unit_price": 275.00,
      "subtotal": 275.00
    }
  ],
  "payments": [
    {
      "payment_id": 1,
      "payment_method": "UPI",
      "amount": 403.00,
      "payment_date": ISODate("2026-02-15T10:32:00Z"),
      "reference_number": "UPI-REF-99882211",
      "status": "SUCCESS"
    }
  ]
}
```

### B. Purchase Order Document (Embedding Procurement Lines)
```json
{
  "_id": ObjectId("6ada16f898bae078ccabfb50"),
  "po_id": 1,
  "po_number": "PO-2026-001",
  "supplier_id": 1,
  "supplier_name": "Heritage Agro & Dairy Ltd",
  "created_by": 4,
  "order_date": ISODate("2026-02-01T00:00:00Z"),
  "expected_delivery_date": ISODate("2026-02-05T00:00:00Z"),
  "status": "COMPLETED",
  "total_amount": 29000.00,
  "is_auto_generated": "FALSE",
  "items": [
    { "product_id": 1, "sku": "SKU-DRY-001", "product_name": "Heritage Full Cream Milk 1L", "quantity_ordered": 300, "unit_price": 50.00, "subtotal": 15000.00 },
    { "product_id": 2, "sku": "SKU-DRY-002", "product_name": "Amul Salted Butter 500g", "quantity_ordered": 40, "unit_price": 220.00, "subtotal": 8800.00 },
    { "product_id": 3, "sku": "SKU-DRY-003", "product_name": "Amul Processed Cheese Blocks 400g", "quantity_ordered": 20, "unit_price": 260.00, "subtotal": 5200.00 }
  ]
}
```

---

## 11. Embedding and Referencing Decisions

1. **Why Embed Line Items (`items` array)?**
   - *Containment Semantics:* A `SalesTransactionLine` or `PurchaseOrderLine` has no independent existence outside its parent transaction.
   - *Atomic Persistence:* Inserting an entire order with 10 lines is a single atomic document write.
   - *Zero-Join Read:* Displaying a receipt in the POS terminal or mobile app requires 0 joins.
2. **Why Embed Multi-Valued Attributes (`phone_numbers` array)?**
   - In SQL, 1NF prohibited multivalued columns, forcing phone numbers into separate tables. In MongoDB, arrays are native, eliminating join complexity.
3. **Why Keep `inventory_stock` Separate (Referencing)?**
   - Stock records experience very high update frequency (every sale, transfer, and receipt updates stock). Embedding stock inside `products` would cause massive write lock contention on the product catalog. Maintaining `inventory_stock` as an independent collection indexed on `{ location_id: 1, product_id: 1 }` enables high-throughput concurrency via atomic `$inc`.
4. **Why Dual Projection for Payments?**
   - Payments are embedded in `sales_transactions` to guarantee atomic split-tender POS checkouts, and simultaneously mirrored in `payments` to enable indexed financial reconciliation and tender aggregations without unwinding large transaction trees.

---

## 12. Collection Descriptions

The 14 implemented collections are:
1. `customers`: Master profile of registered shoppers, loyalty points balances, and phone contact arrays.
2. `employees`: Store personnel directory with role segregation (`MANAGER`, `CASHIER`, `PROCUREMENT_OFFICER`, `WAREHOUSE_STAFF`, `ADMIN`).
3. `product_categories`: Hierarchical merchandise categories with materialized `category_path` breadcrumbs.
4. `products`: Master merchandise catalog containing SKUs, barcodes, unit prices, UOM, and active flags.
5. `suppliers`: Master vendor registry with GST identification, contact names, phone arrays, and ratings.
6. `inventory_locations`: Facility storage topography distinguishing `WAREHOUSE` from retail `SHELF` locations.
7. `inventory_stock`: Current live stock balances per location with safety reorder thresholds.
8. `inventory_transactions`: Immutable audit ledger recording every physical movement (`RECEIPT`, `TRANSFER_IN`, `TRANSFER_OUT`, `SALE`, `ADJUSTMENT`).
9. `purchase_orders`: Inbound procurement orders with embedded item lines.
10. `shipments`: Freight logistics tracking with embedded shipment reconciliation lines.
11. `sales_transactions`: Point-of-sale receipt headers with embedded sold items and split payments.
12. `payments`: Dedicated financial tender settlement ledger.
13. `restock_events`: Internal warehouse-to-shelf movement event tracking.
14. `reorder_triggers`: Low warehouse stock alert triggers for supplier replenishment.

---

## 13. Indexes and Validation Rules

### A. Index Architecture
- **Unique Indexes:** Enforced on `customer_id`, `customers.email`, `employee_id`, `employees.email`, `category_id`, `category_name`, `product_id`, `products.sku`, `products.barcode`, `supplier_id`, `suppliers.gst_number`, `location_id`, `location_code`, `po_id`, `po_number`, `shipment_id`, `shipments.tracking_number`, `sales_transactions.receipt_number`, `payments.payment_id`, `restock_id`, and `trigger_id`.
- **Compound Unique Index:** Enforced on `inventory_stock` (`{ location_id: 1, product_id: 1 }`), physically preventing duplicate stock records for the same product at the same location.
- **Performance Indexes:** Multikey index on `customers.phone_numbers` and `suppliers.phone_numbers`, date-sorting indexes on `sales_transactions.transaction_date`, and full-text search index on `products.product_name` and `products.description`.

### B. Schema Validation
MongoDB JSON Schema validators enforce:
- Valid regex format on customer emails (`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`).
- Strictly positive unit prices (`standard_unit_price >= 0.01`).
- Non-negative stock quantities (`quantity_on_hand >= 0`).
- Valid enums for employee roles, shipment statuses, payment methods, and transaction types.

---

## 14. Implementation Details

The implementation is coded cleanly in Python 3.13 utilizing:
- `pymongo 4.19`: Synchronous, high-performance database driver.
- `pydantic 2.12`: Input data parsing and schema validation.
- `fastapi 0.127`: Asynchronous REST API framework.
- `pytest 9.1`: Automated unit and integration testing.

Concurrency is handled via atomic conditional updates:
```python
updated = db.inventory_stock.find_one_and_update(
    {"location_id": shelf_id, "product_id": prod_id, "quantity_on_hand": {"$gte": qty}},
    {"$inc": {"quantity_on_hand": -qty}, "$set": {"last_updated_at": datetime.now(timezone.utc)}},
    return_document=ReturnDocument.AFTER
)
```
If `quantity_on_hand < qty`, `updated` returns `None`, rejecting the sale before any data corruption can occur.

---

## 15. Sample Data

The database is seeded with deterministic, realistic supermarket records matching DA2:
- 5 Suppliers (Heritage Agro, Britannia Fresh, Himalayan Pure Beverages, Godrej Consumer Goods, Organic Harvest Mills).
- 11 Categories across 2 hierarchical tiers (Dairy, Bakery, Beverages, Personal Care, Staples).
- 15 Products with genuine barcodes, SKUs, and Indian Rupee prices.
- 6 Employees representing all 5 roles.
- 6 Storage Locations (2 Central Warehouses: Ambient and Cold Storage; 4 Retail Shelves).
- 20 Live Inventory Stock balances demonstrating products with sufficient stock and products breaching thresholds.
- 5 Customers with loyalty points and tiers (`REGULAR`, `SILVER`, `GOLD`, `PLATINUM`).
- Baseline Purchase Orders, Inbound Shipments, Sales Receipts, Split Payments, and Audit Transactions.

---

## 16. Core CRUD Operations

The implementation provides executable demonstrations for all required CRUD methods:
- `insertOne()`: Added Customer ID 101 with embedded phone numbers.
- `insertMany()`: Added multiple organic products in a single operation.
- `find()` & `findOne()`: Filtered active products with projection, sort, and limit.
- `updateOne()`: Incremented loyalty points atomically (`$inc: { loyalty_points: 450 }`).
- `updateMany()`: Applied promotional flags to products with price `<= 50.00`.
- `deleteOne()` & `deleteMany()`: Cleaned up demonstration records.

---

## 17. Advanced Queries and Aggregations

1. **Category Revenue Aggregation:** Utilizes `$match`, `$unwind`, `$lookup`, and `$group` to calculate total revenue, units sold, and average price per category.
2. **Best-Selling Products:** Unwinds sales line items and identifies top-selling products by quantity and revenue with conditional badges via `$addFields`.
3. **Enterprise Stock Valuation:** Joins `inventory_stock` with `products` and `inventory_locations` to compute physical units (783 units) and monetary holdings (Rs. 117,242.00) grouped by location type (`WAREHOUSE` vs. `SHELF`).
4. **Multi-Collection Receipt Reconstruction:** Demonstrates `$lookup` joins on `sales_transactions` to reconstruct the receipt with customer and cashier details, matching the DA2 5-table join.

---

## 18. Inventory and Sales Workflow

The system faithfully executes the approved retail lifecycle:
```
[ Supplier ]
     │
     ▼ (Shipment Delivery: receive_shipment)
[ Inbound Shipment Received ]
     │ (Increments Warehouse Stock & Resolves PO)
     ▼
[ Warehouse Storage (Bulk) ]
     │
     ▼ (transfer_stock: Decrements WH, Increments Shelf, Logs Dual Audit)
[ Retail Shelf Display ]
     │
     ▼ (Customer Purchase: process_sale)
[ POS Sale Execution ]
     │ (Decrements Shelf Stock, Records Split Tender, Earns Loyalty Points)
     ▼
[ Threshold Evaluation ]
     ├── If Shelf QOH <= Threshold ──► Trigger RestockEvent (Warehouse -> Shelf)
     └── If Warehouse QOH <= Threshold ──► Trigger ReorderTrigger & Auto-Generate PO
```

---

## 19. Test Cases and Actual Results

The automated test suite (`da3_mongodb/tests`) was executed against `smartretail_test_db`. All **17 test cases passed cleanly** in 2.70 seconds:

| Test Case | Objective | Mechanism | Status |
|---|---|---|---|
| `test_successful_insertion_and_retrieval` | Document persistence | `insertOne` & `find_one` | **PASSED** |
| `test_product_updates` | Catalog modification | `update_one` | **PASSED** |
| `test_unique_index_enforcement` | Duplicate prevention | `DuplicateKeyError` on email, SKU, location+product | **PASSED** |
| `test_schema_validation_rejection` | Constraint enforcement | `WriteError` (121) on invalid email, price, role | **PASSED** |
| `test_inventory_decrement_after_sale` | Stock balance sync | Decrements shelf stock and logs audit | **PASSED** |
| `test_rejection_of_sale_exceeding_stock` | Overdraft prevention | Rejects sale exceeding available stock | **PASSED** |
| `test_payment_split_and_association` | Multi-tender checkout | Persists split Card + UPI payments | **PASSED** |
| `test_duplicate_receipt_rejection` | Idempotency | Rejects second attempt of same receipt | **PASSED** |
| `test_referential_consistency_checks` | Domain validation | Blocks sales from warehouse or inactive items | **PASSED** |
| `test_stock_transfer_between_locations` | Shelf restock | Decrements WH, increments shelf, logs RestockEvent | **PASSED** |
| `test_transfer_rejections` | Defensive validation | Rejects transfer on identical locations or low stock | **PASSED** |
| `test_shipment_receipt_and_replenishment` | Receiving lifecycle | Increments WH stock, marks PO COMPLETED | **PASSED** |
| `test_purchase_order_creation_and_reorder_trigger` | Auto-procurement | Creates PO and transitions trigger to `PO_CREATED` | **PASSED** |
| `test_end_to_end_workflow` | 5-stage retail cycle | Executes full lifecycle consecutively | **PASSED** |
| `test_revenue_by_category_aggregation` | Analytical pipeline | Computes Rs. 1,708.00 total revenue | **PASSED** |
| `test_receipt_lookup_join` | Relational join | Reconstructs 5-table receipt via `$lookup` | **PASSED** |
| `test_enterprise_stock_valuation` | Global KPI aggregation | Computes 783 physical units & Rs. 117,242.00 value | **PASSED** |

---

## 20. Oracle vs. MongoDB Comparative Analysis

A technical comparison between Oracle 11g XE and MongoDB 8.2 reveals:
- **Schema & Normalization:** Oracle's BCNF model prioritizes update anomaly prevention through extreme normalization (19 tables). MongoDB prioritizes read/write locality by embedding child entities, collapsing the model into 14 collections with zero join overhead on transactional paths.
- **Integrity Enforcement:** Oracle relies on declarative database constraints and triggers. MongoDB enforces constraints at the document boundary via JSON Schema and coordinates referential integrity at the application service tier.
- **Concurrency & Transactions:** Oracle provides multi-table ACID transactions with deterministic row locks (`FOR UPDATE`). MongoDB provides atomic single-document operations (`$inc` + `$gte`), and multi-document ACID transactions across replica set deployments.
- **Scalability:** Oracle 11g XE scales vertically. MongoDB scales horizontally through native replica sets and automated sharding across commodity clusters.

---

## 21. Advantages of the MongoDB Implementation

1. **High-Speed Point of Sale:** Complete customer checkout receipts are committed in a single BSON document write without multi-table row locks.
2. **Simplified Contact Management:** Multi-valued phone numbers are stored natively as arrays, eliminating auxiliary weak entity tables.
3. **Agile Catalog Evolution:** New product categories and dynamic attributes can be ingested without executing schema migration scripts.
4. **Rich Aggregation Capabilities:** Complex retail metrics are computed via pipelined stream transformations.

---

## 22. Limitations

1. **Referential Integrity Delegation:** Foreign key constraints are enforced at the service tier; deleting a product does not automatically cascade or abort at the database engine level unless handled in code.
2. **Transaction Scope in Standalone Deployments:** Multi-document ACID transactions require a configured MongoDB replica set; standalone local installations rely on atomic conditional updates and compensating sagas.
3. **Join Performance at Scale:** Performing multi-stage `$lookup` joins across high-cardinality collections introduces CPU and memory overhead compared to native relational hash joins.

---

## 23. Conclusion

Digital Assignment 3 successfully demonstrates the design, implementation, and verification of the **SmartRetail DBMS** using **MongoDB 8.2**. By extending the completed Oracle DA2 implementation rather than replacing it, the project bridges the gap between traditional relational database engineering and modern non-relational document paradigms. The resulting implementation guarantees data integrity, achieves sub-millisecond POS checkout locality, automates multi-tier inventory replenishment, and passes all 17 automated test cases with verified academic rigor.
