# SmartRetail DA3 — MongoDB Data Model & Schema Design

## 1. Overview and Design Philosophy

In migrating the SmartRetail enterprise database from Oracle Database 11g XE to MongoDB 8.2, our objective is to maximize document-oriented performance, eliminate multi-table join penalties during point-of-sale and procurement reads, preserve transactional integrity, and enforce strict data quality via **MongoDB JSON Schema Validation** and indexes.

Relational databases store data in normalized 1NF/BCNF tables. In MongoDB, relationships are evaluated through two primary patterns:
1. **Embedding (Denormalization):** Applied when entities have strong containment semantics, are queried together, and have bounded 1-to-few cardinalities (e.g., customer contact numbers, order line items, shipment items, and split-tender payment splits).
2. **Referencing (Normalized Linking):** Applied when entities have independent life cycles, 1-to-many unbounded cardinalities, or are accessed across multiple disparate workflows (e.g., product master, inventory locations, stock ledger, and supplier profiles).

---

## 2. Document Schema Definitions

### 2.1 Collection: `customers`
- **Purpose:** Stores customer identity, loyalty points, tier status, and multi-valued phone contacts.
- **Embedding Decision:** Embeds `CUSTOMERPHONE` as `phone_numbers` array. Eliminates relational join for customer contact details.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "customer_id": 1,
  "first_name": "Aditya",
  "last_name": "Verma",
  "email": "aditya.verma@gmail.com",
  "phone_numbers": ["+91-9871122334"],
  "loyalty_points": 450,
  "membership_type": "SILVER",
  "registered_date": ISODate("2024-04-12T00:00:00Z")
}
```

### 2.2 Collection: `employees`
- **Purpose:** Master directory of retail staff across roles (Cashier, Manager, Procurement Officer, Warehouse Staff, Admin).
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "employee_id": 1,
  "full_name": "Sunil Joshi",
  "role": "MANAGER",
  "email": "sunil.joshi@smartretail.com",
  "phone": "+91-9844011111",
  "hire_date": ISODate("2023-01-15T00:00:00Z")
}
```

### 2.3 Collection: `product_categories`
- **Purpose:** Hierarchical merchandise category taxonomy.
- **Hierarchy Handling:** References `parent_category_id` and includes `category_path` string for fast breadcrumb queries without recursive joins.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "category_id": 6,
  "category_name": "Fresh Milk & Cream",
  "parent_category_id": 1,
  "category_path": "Dairy & Refrigerated / Fresh Milk & Cream"
}
```

### 2.4 Collection: `products`
- **Purpose:** Central merchandise catalog tracking SKU, barcode, unit of measure, pricing, and active status.
- **Referencing & Embedding:** References `category_id` while embedding `category_name` snapshot to optimize high-volume catalog lookups.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "product_id": 1,
  "sku": "SKU-DRY-001",
  "barcode": "8901030010011",
  "product_name": "Heritage Full Cream Milk 1L",
  "description": "Pasteurized homogenized cow milk pouch",
  "category_id": 6,
  "category_name": "Fresh Milk & Cream",
  "unit_of_measure": "LITER",
  "standard_unit_price": 64.00,
  "is_active": "TRUE"
}
```

### 2.5 Collection: `suppliers`
- **Purpose:** Master vendor registry for procurement.
- **Embedding Decision:** Embeds `SUPPLIERPHONE` as `phone_numbers` array and structures postal address as an embedded subdocument `address`.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "supplier_id": 1,
  "supplier_name": "Heritage Agro & Dairy Ltd",
  "contact_person": "Ramesh Sharma",
  "email": "ramesh@heritageagro.in",
  "gst_number": "GSTIN29AABCH1234F1Z1",
  "phone_numbers": ["+91-9845012345", "+91-080-28394050"],
  "address": {
    "street": "Plot 45, Peenya Industrial Area",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560058"
  },
  "rating": 4.75,
  "created_at": ISODate("2025-01-10T00:00:00Z")
}
```

### 2.6 Collection: `inventory_locations`
- **Purpose:** Storage facility topology distinguishing `WAREHOUSE` locations from front-of-store retail `SHELF` locations.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "location_id": 3,
  "location_code": "SH-DAIRY-01",
  "location_type": "SHELF",
  "location_name": "Front Chilled Dairy Showcase",
  "parent_location_id": 2,
  "capacity": 400,
  "aisle_number": "Aisle-01",
  "zone": "STORE-FRONT-COLD"
}
```

### 2.7 Collection: `inventory_stock`
- **Purpose:** Real-time stock snapshot per product per physical location.
- **Integrity Rule:** Compound unique index on `{ location_id: 1, product_id: 1 }`. Schema validator enforces `quantity_on_hand >= 0`.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "location_id": 3,
  "product_id": 1,
  "quantity_on_hand": 8,
  "reorder_threshold": 15,
  "reorder_quantity": 30,
  "last_updated_at": ISODate("2026-02-15T10:30:00Z")
}
```

### 2.8 Collection: `inventory_transactions`
- **Purpose:** Immutable audit ledger tracking every stock addition, deduction, or transfer.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "transaction_id": 1,
  "product_id": 1,
  "location_id": 2,
  "transaction_type": "RECEIPT",
  "quantity": 300,
  "transaction_date": ISODate("2026-02-04T11:00:00Z"),
  "reference_type": "SHIPMENT",
  "reference_id": 1
}
```

### 2.9 Collection: `purchase_orders`
- **Purpose:** Procurement orders sent to suppliers.
- **Embedding Decision:** Embeds `PURCHASEORDERLINE` records as an array of line items (`items`). Ensures single-document atomicity for PO creation and retrieval.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
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
    {
      "product_id": 1,
      "sku": "SKU-DRY-001",
      "product_name": "Heritage Full Cream Milk 1L",
      "quantity_ordered": 300,
      "unit_price": 50.00,
      "subtotal": 15000.00
    },
    {
      "product_id": 2,
      "sku": "SKU-DRY-002",
      "product_name": "Amul Salted Butter 500g",
      "quantity_ordered": 40,
      "unit_price": 220.00,
      "subtotal": 8800.00
    },
    {
      "product_id": 3,
      "sku": "SKU-DRY-003",
      "product_name": "Amul Processed Cheese Blocks 400g",
      "quantity_ordered": 20,
      "unit_price": 260.00,
      "subtotal": 5200.00
    }
  ]
}
```

### 2.10 Collection: `shipments`
- **Purpose:** Inbound logistics and receiving reconciliation.
- **Embedding Decision:** Embeds `SHIPMENTLINE` records as an array of items with shipped and received quantities.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "shipment_id": 1,
  "tracking_number": "TRK-IND-902181",
  "po_id": 1,
  "carrier": "BlueDart Express",
  "shipment_date": ISODate("2026-02-02T00:00:00Z"),
  "received_date": ISODate("2026-02-04T00:00:00Z"),
  "status": "RECEIVED",
  "received_by": 5,
  "items": [
    {
      "product_id": 1,
      "sku": "SKU-DRY-001",
      "quantity_shipped": 300,
      "quantity_received": 300
    },
    {
      "product_id": 2,
      "sku": "SKU-DRY-002",
      "quantity_shipped": 40,
      "quantity_received": 40
    },
    {
      "product_id": 3,
      "sku": "SKU-DRY-003",
      "quantity_shipped": 20,
      "quantity_received": 20
    }
  ]
}
```

### 2.11 Collection: `sales_transactions`
- **Purpose:** Point-of-sale customer checkout records.
- **Embedding Decision:** Embeds both `SALESTRANSACTIONLINE` items and split-tender `PAYMENT` items. A complete receipt is saved and read atomically in one document!
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
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

### 2.12 Collection: `payments`
- **Purpose:** Dedicated payment ledger for financial audit, reconciliation, and settlement aggregation across tenders.
- **Dual Projection Pattern:** Populated during checkout alongside `sales_transactions.payments` for index-optimized accounting queries.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "payment_id": 1,
  "transaction_id": 1,
  "receipt_number": "RCP-2026-0001",
  "payment_method": "UPI",
  "amount": 403.00,
  "payment_date": ISODate("2026-02-15T10:32:00Z"),
  "reference_number": "UPI-REF-99882211",
  "status": "SUCCESS"
}
```

### 2.13 Collection: `restock_events`
- **Purpose:** Tracks internal warehouse-to-shelf replenishment movements.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "restock_id": 1,
  "product_id": 1,
  "product_name": "Heritage Full Cream Milk 1L",
  "from_location_id": 2,
  "to_location_id": 3,
  "quantity_moved": 50,
  "event_date": ISODate("2026-02-06T08:30:00Z"),
  "triggered_by": "AUTO_THRESHOLD",
  "performed_by": 5,
  "status": "COMPLETED"
}
```

### 2.14 Collection: `reorder_triggers`
- **Purpose:** Low warehouse stock alert triggers for supplier procurement.
- **Document Structure:**
```json
{
  "_id": ObjectId("..."),
  "trigger_id": 1,
  "product_id": 7,
  "product_name": "Real Fruit Power Mixed Fruit Juice 1L",
  "location_id": 1,
  "stock_at_trigger": 20,
  "threshold_at_trigger": 25,
  "trigger_date": ISODate("2026-02-18T10:00:00Z"),
  "generated_po_id": 3,
  "status": "PO_CREATED"
}
```
