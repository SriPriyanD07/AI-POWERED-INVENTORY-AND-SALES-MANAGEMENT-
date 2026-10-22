# SmartRetail DBMS — DA3 MongoDB Implementation

## Executive Overview

**SmartRetail DA3** extends the approved SmartRetail DBMS mini-project by implementing an enterprise-grade, document-oriented database using **MongoDB 8.2** and **Python (PyMongo + FastAPI)**.

This implementation preserves the completed Oracle Database 11g XE relational architecture (DA2) while demonstrating modern document modeling paradigms:
- **Embedded Documents:** Eliminates relational join penalties by embedding child lines (`PurchaseOrderLine` -> `purchase_orders.items`, `ShipmentLine` -> `shipments.items`, `SalesTransactionLine` -> `sales_transactions.items`).
- **Native Arrays:** Multivalued attributes (`CustomerPhone`, `SupplierPhone`) stored directly as first-class arrays.
- **Embedded Split-Tender Payments:** Complete point-of-sale receipt written atomically in a single document.
- **Strict Data Integrity:** Enforces domain constraints via **MongoDB JSON Schema Validation** and compound unique indexes.
- **Atomic Stock Management:** Prevents overdraft and negative inventory through atomic conditional mutations (`$inc` + `$gte`).
- **Reactive Workflow:** Automated replenishment events (`RestockEvent` for depleted shelves; `ReorderTrigger` for depleted warehouse stock).

---

## Directory Organization

```
da3_mongodb/
├── README.md                           # Faculty Demonstration Guide & Project Manual
├── requirements.txt                    # Python dependencies (PyMongo, FastAPI, Pydantic, etc.)
├── .env.example                        # Template environment variables
├── .env                                # Local environment configuration
│
├── scripts/
│   ├── create_validators.js            # MongoDB JSON Schema validation rules (mongosh)
│   ├── create_indexes.js               # Unique, compound, and performance indexes (mongosh)
│   ├── seed_data.js                    # Deterministic supermarket dataset (mongosh)
│   ├── setup_database.py               # Python database initialization runner
│   └── seed_data.py                    # Python seed script
│
├── src/
│   ├── database.py                     # MongoDB connection pool & transaction manager
│   ├── models.py                       # Pydantic domain models & request schemas
│   ├── api.py                          # FastAPI REST API with Swagger documentation
│   ├── main.py                         # Master CLI demonstration runner
│   ├── repositories/                   # Data Access Object (DAO) layer
│   │   ├── base_repository.py
│   │   ├── customer_repository.py
│   │   ├── product_repository.py
│   │   ├── inventory_repository.py
│   │   ├── sales_repository.py
│   │   └── procurement_repository.py
│   └── services/                       # Business logic & workflow orchestration
│       ├── inventory_service.py        # Stock transfer & threshold evaluation
│       ├── sales_service.py            # POS checkout, split payment, & restock trigger
│       ├── procurement_service.py      # PO generation & shipment reconciliation
│       └── workflow_service.py         # 5-stage retail cycle orchestrator
│
├── queries/
│   ├── crud_examples.js                # insertOne, insertMany, find, update, delete
│   ├── aggregation_examples.js         # $match, $group, $project, $sort, $unwind, $lookup
│   ├── lookup_examples.js              # Multi-collection joins & receipt reconstruction
│   └── business_queries.py             # 15 canonical business queries (PyMongo)
│
├── tests/
│   ├── conftest.py                     # Isolated test fixtures on smartretail_test_db
│   ├── test_validators_indexes.py      # Schema validation & unique index enforcement
│   ├── test_sales_and_stock.py         # Decrement, overdraft rejection, & split payment
│   ├── test_workflow_inventory.py      # Restock, transfers, shipments, & lifecycle
│   └── test_aggregations.py            # Revenue pipelines & cross-location valuation
│
├── docs/
│   ├── mongodb_data_model.md           # Formal document schema specification
│   ├── oracle_to_mongodb_mapping.md    # 19-relation mapping matrix & rationale
│   ├── test_results.md                 # 17-part automated test execution log
│   └── comparative_analysis.md         # Formal academic comparison: Oracle vs MongoDB
│
└── reports/
    ├── SmartRetail_DA3_Report.docx      # Academic report submission document
    └── SmartRetail_DA3_Report.md        # Academic report source markdown
```

---

## Prerequisites

1. **MongoDB Server 8.2+:** Installed and running on `localhost:27017`.
2. **MongoDB Shell (`mongosh`):** Installed (`npm install -g mongosh` or binary).
3. **Python 3.10+:** Python 3.13 installed with packages from `requirements.txt`:
   ```bash
   pip install -r da3_mongodb/requirements.txt
   ```

---

## Faculty Step-by-Step Demonstration Guide

Follow this sequence of commands to demonstrate all project capabilities to faculty.

### Step 1: Initialize Database, Apply Validators & Create Indexes
Demonstrates database setup, schema validation rules, and unique/compound indexes.

**Option A (Using MongoDB Shell `mongosh`):**
```powershell
mongosh da3_mongodb/scripts/create_validators.js
mongosh da3_mongodb/scripts/create_indexes.js
mongosh da3_mongodb/scripts/seed_data.js
```

**Option B (Using Python):**
```powershell
python da3_mongodb/scripts/setup_database.py
python da3_mongodb/scripts/seed_data.py
```
*Expected Outcome:* Initializes all 14 collections, configures strict JSON Schema validation, creates unique indexes on business identifiers, and seeds 20 inventory stock items, 15 products, 5 suppliers, 5 customers, and baseline orders.

---

### Step 2: Run Master End-to-End Workflow & Business Queries
Demonstrates the full retail lifecycle followed by the 15 approved business queries in a single automated runner:
```powershell
python da3_mongodb/src/main.py
```
*What it demonstrates:*
1. **Shipment Receiving:** Inbound freight receipt increments warehouse stock and completes purchase order.
2. **Warehouse-to-Shelf Transfer:** Decrements warehouse and increments retail display shelf with dual audit ledger logging.
3. **Customer Checkout:** Point-of-sale sale decrements shelf stock and records split-tender payments.
4. **Automated Replenishment Detection:** Shelf stock drops below threshold, triggering automated `RestockEvent`.
5. **Supplier Reorder:** Warehouse safety stock breach automatically generates a `PurchaseOrder`.
6. **15 Canonical Business Queries:** Executes queries for product catalog, low stock alerts, revenue by category, best-selling products, and inventory valuation.

---

### Step 3: Run the 17-Part Automated Test Suite
Executes the automated test suite on an isolated test database (`smartretail_test_db`):
```powershell
python -m pytest da3_mongodb/tests -v
```
*Expected Outcome:* `17 passed in ~2.7s` with zero failures.

---

### Step 4: Execute Database Query Scripts Directly via `mongosh`
Demonstrates interactive MongoDB Shell scripting:

```powershell
# Core CRUD Operations (insertOne, insertMany, find, updateOne, delete)
mongosh da3_mongodb/queries/crud_examples.js

# Aggregation Pipelines ($match, $group, $project, $sort, $unwind)
mongosh da3_mongodb/queries/aggregation_examples.js

# Multi-Collection Joins & Receipt Reconstruction ($lookup)
mongosh da3_mongodb/queries/lookup_examples.js
```

---

### Step 5: Launch the Interactive FastAPI REST API
Demonstrates the REST API with interactive Swagger UI:
```powershell
uvicorn da3_mongodb.src.api:app --reload --host 127.0.0.1 --port 8000
```
Open your browser and navigate to:
👉 **`http://127.0.0.1:8000/docs`**

Key Interactive Endpoints:
- `GET /products`: List & search products.
- `GET /inventory/stock/{product_id}`: View stock across warehouse and shelf locations.
- `GET /inventory/low-stock`: View products breaching replenishment thresholds.
- `POST /sales/checkout`: Process POS customer purchase with split-tender payment.
- `POST /inventory/transfer`: Transfer stock from warehouse to shelf.
- `GET /analytics/summary`: Real-time enterprise inventory and sales dashboard.
- `POST /workflow/demonstrate`: Trigger the complete 5-stage retail cycle on demand.
