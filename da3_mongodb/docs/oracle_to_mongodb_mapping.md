# Oracle-to-MongoDB Relational-to-Document Mapping

## 1. Comprehensive Relational Mapping Matrix

The following table provides the exhaustive mapping of the **19 approved Oracle relations** from DA2 to the **MongoDB 8.2 Document Model** in DA3.

| # | Oracle Relation (DA2) | MongoDB Collection (DA3) | Mapping Strategy | Primary Key / Document Identifier | Foreign Key / Relationship Representation | Business & Performance Rationale |
|---|---|---|---|---|---|---|
| 1 | `Customer` | `customers` | Separate Collection | `_id` (ObjectId) & `customer_id` (Unique Int) | Referenced in `sales_transactions.customer_id` | Master customer entity accessed across checkout, loyalty queries, and customer profiles. |
| 2 | `CustomerPhone` | `customers.phone_numbers` | Embedded Array of Strings | Composite PK in SQL `(customer_id, phone_number)` | Embedded directly inside parent `customer` document | 1NF multivalued phone weak entity; 1-to-few bounded relationship. Eliminates 1 relational join on every profile fetch. |
| 3 | `Employee` | `employees` | Separate Collection | `_id` & `employee_id` (Unique Int) | Referenced in `sales_transactions.cashier_id`, `purchase_orders.created_by`, `shipments.received_by` | Independent administrative and POS staff entity. |
| 4 | `ProductCategory` | `product_categories` | Separate Collection | `_id` & `category_id` (Unique Int) | `parent_category_id` (Self-referencing Int) + embedded `category_path` | Hierarchical taxonomy. Adding materialized `category_path` eliminates recursive Oracle `START WITH ... CONNECT BY` tree queries. |
| 5 | `Product` | `products` | Separate Collection | `_id` & `product_id` (Unique Int), `sku` (Unique), `barcode` (Unique) | `category_id` (Reference) + embedded `category_name` snapshot | Central merchandise catalog; referenced by inventory, POs, and sales. |
| 6 | `Supplier` | `suppliers` | Separate Collection | `_id` & `supplier_id` (Unique Int), `gst_number` (Unique) | Referenced in `purchase_orders.supplier_id` | Master vendor entity for supply chain management. |
| 7 | `SupplierPhone` | `suppliers.phone_numbers` | Embedded Array of Strings | Composite PK in SQL `(supplier_id, phone_number)` | Embedded directly inside parent `supplier` document | 1NF multivalued contact number weak entity; bounded 1-to-few relationship. Eliminates join. |
| 8 | `InventoryLocation` | `inventory_locations` | Separate Collection | `_id` & `location_id` (Unique Int), `location_code` (Unique) | `parent_location_id` (Self-referencing Int to Warehouse) | Physical facility storage layout (WAREHOUSE vs SHELF). |
| 9 | `InventoryStock` | `inventory_stock` | Separate Collection | Compound Unique Index: `{ location_id: 1, product_id: 1 }` | `location_id` references `inventory_locations`, `product_id` references `products` | High-frequency update ledger maintaining live quantity-on-hand. Kept separate to allow atomic conditional updates (`$inc`) without document lock contention. |
| 10 | `InventoryTransaction` | `inventory_transactions` | Separate Collection | `_id` & `transaction_id` (Unique Int) | `product_id`, `location_id`, `reference_id` | Immutable append-only audit trail recording every physical stock delta (`RECEIPT`, `TRANSFER_IN`, `TRANSFER_OUT`, `SALE`, `ADJUSTMENT`). |
| 11 | `PurchaseOrder` | `purchase_orders` | Separate Collection | `_id` & `po_id` (Unique Int), `po_number` (Unique) | `supplier_id`, `created_by` | Procurement order header. |
| 12 | `PurchaseOrderLine` | `purchase_orders.items` | Embedded Array of Documents | Composite PK in SQL `(po_id, product_id)` | Embedded within `purchase_orders` | Lines are tightly coupled with the PO lifecycle. Embedding eliminates relational join, guarantees atomic order creation, and aligns with document-oriented paradigms. |
| 13 | `Shipment` | `shipments` | Separate Collection | `_id` & `shipment_id` (Unique Int), `tracking_number` (Unique) | `po_id`, `received_by` | Inbound freight carrier shipment. |
| 14 | `ShipmentLine` | `shipments.items` | Embedded Array of Documents | Composite PK in SQL `(shipment_id, product_id)` | Embedded within `shipments` | Receiving reconciliation items. Embedded directly inside shipment document. |
| 15 | `SalesTransaction` | `sales_transactions` | Separate Collection | `_id` & `transaction_id` (Unique Int), `receipt_number` (Unique) | `customer_id`, `cashier_id` | Point-of-sale receipt header. |
| 16 | `SalesTransactionLine` | `sales_transactions.items` | Embedded Array of Documents | Composite PK in SQL `(transaction_id, product_id)` | Embedded within `sales_transactions` | Retail receipt line items. Embedding guarantees single-document atomic write for entire checkout receipt without multi-table locking. |
| 17 | `Payment` | `sales_transactions.payments` & `payments` | Dual Projection (Embedded & Separate) | `payment_id` (Unique Int) | `transaction_id` references `sales_transactions` | Embedded in `sales_transactions` for atomic split-tender POS checkout; projected into `payments` collection for fast financial reporting and audit queries. |
| 18 | `RestockEvent` | `restock_events` | Separate Collection | `_id` & `restock_id` (Unique Int) | `product_id`, `from_location_id`, `to_location_id`, `performed_by` | Internal warehouse-to-shelf movement workflow record. |
| 19 | `ReorderTrigger` | `reorder_triggers` | Separate Collection | `_id` & `trigger_id` (Unique Int) | `product_id`, `location_id`, `generated_po_id` | External supplier procurement alert record. |

---

## 2. Structural & Architectural Transformation Highlights

### A. Denormalization of Weak Child Entities
In Oracle 11g, 1NF prohibited multivalued attributes, forcing phone numbers into `CustomerPhone` and `SupplierPhone` tables. In MongoDB, arrays are native first-class constructs:
```json
// Customer document in MongoDB
{
  "customer_id": 1,
  "first_name": "Aditya",
  "phone_numbers": ["+91-9871122334"]
}
```

### B. Single-Document Atomicity for Transactions and Lines
In Oracle DA2, recording a sale required inserting 1 row into `SalesTransaction`, multiple rows into `SalesTransactionLine`, and 1 or more rows into `Payment`, relying on PL/SQL trigger `TRG_SALE_LINE_TOTAL_SYNC` and transaction rollback if any line failed.
In MongoDB DA3, the receipt header, items, and payments form a cohesive document. A single `insertOne()` or `updateOne()` writes the entire transaction atomically!

### C. Atomic Stock Balance Verification (`$inc` and `$gte`)
In Oracle DA2, `PROCESS_SALE` used `SELECT ... FOR UPDATE` to lock the inventory row and checked `IF v_stock_qoh < p_quantity`.
In MongoDB, atomic conditional updates guarantee non-negative stock without table locking:
```javascript
db.inventory_stock.findOneAndUpdate(
  { location_id: shelfLocId, product_id: prodId, quantity_on_hand: { $gte: qtySold } },
  { $inc: { quantity_on_hand: -qtySold }, $set: { last_updated_at: new Date() } }
)
```
If `quantity_on_hand` is less than `qtySold`, the filter does not match and no update occurs, safely preventing negative inventory!
