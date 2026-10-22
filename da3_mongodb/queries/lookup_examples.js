/**
 * SmartRetail DA3 — $lookup Relationship & Join Examples
 * Script: da3_mongodb/queries/lookup_examples.js
 * Description: Demonstrates MongoDB $lookup stages representing relational foreign keys:
 *              1. Basic equality lookup (Products -> Categories)
 *              2. Multi-collection join: Sales -> Customer -> Cashier (receipt reconstruction)
 *              3. Correlated pipeline lookup (Suppliers -> Purchase Orders)
 *              4. Stock consolidation join (InventoryStock -> Location -> Product)
 */

const dbName = "smartretail_db";
const dbInstance = db.getSiblingDB(dbName);

print(`=========================================================================`);
print(`SmartRetail $lookup Join Demonstrations on: ${dbName}`);
print(`=========================================================================`);

// 1. Basic Equality Lookup: Products with Category Details
print("\n--- 1. Basic Equality Lookup: Product with Full Category Details ---");
const productCategoryJoin = dbInstance.products.aggregate([
  { $match: { product_id: 1 } },
  {
    $lookup: {
      from: "product_categories",
      localField: "category_id",
      foreignField: "category_id",
      as: "category_hierarchy"
    }
  },
  { $unwind: "$category_hierarchy" },
  {
    $project: {
      _id: 0,
      product_id: 1,
      sku: 1,
      product_name: 1,
      standard_unit_price: 1,
      category_name: "$category_hierarchy.category_name",
      category_path: "$category_hierarchy.category_path"
    }
  }
]).toArray();
printjson(productCategoryJoin);

// 2. Multi-Collection Join: Receipt Reconstruction (equivalent to DA2 5-table join)
print("\n--- 2. Multi-Collection Receipt Reconstruction Join ---");
print("Joins sales_transactions with customers, employees (cashier), and unrolls items");
const receiptReconstruction = dbInstance.sales_transactions.aggregate([
  { $match: { receipt_number: "RCP-2026-0001" } },
  {
    $lookup: {
      from: "customers",
      localField: "customer_id",
      foreignField: "customer_id",
      as: "customer"
    }
  },
  {
    $lookup: {
      from: "employees",
      localField: "cashier_id",
      foreignField: "employee_id",
      as: "cashier"
    }
  },
  {
    $project: {
      _id: 0,
      receipt_number: 1,
      transaction_date: 1,
      total_amount: 1,
      customer_name: {
        $concat: [
          { $arrayElemAt: ["$customer.first_name", 0] },
          " ",
          { $arrayElemAt: ["$customer.last_name", 0] }
        ]
      },
      customer_email: { $arrayElemAt: ["$customer.email", 0] },
      cashier_name: { $arrayElemAt: ["$cashier.full_name", 0] },
      items_sold: "$items",
      tender_payments: "$payments"
    }
  }
]).toArray();
printjson(receiptReconstruction);

// 3. Correlated Pipeline Lookup: Suppliers with their Active Purchase Orders
print("\n--- 3. Correlated Pipeline Lookup: Suppliers with Purchase Orders ---");
const supplierOrdersJoin = dbInstance.suppliers.aggregate([
  { $match: { supplier_id: 1 } },
  {
    $lookup: {
      from: "purchase_orders",
      let: { supp_id: "$supplier_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$supplier_id", "$$supp_id"] } } },
        { $project: { _id: 0, po_number: 1, order_date: 1, status: 1, total_amount: 1 } }
      ],
      as: "procurement_orders"
    }
  },
  {
    $project: {
      _id: 0,
      supplier_name: 1,
      contact_person: 1,
      email: 1,
      procurement_orders: 1
    }
  }
]).toArray();
printjson(supplierOrdersJoin);

// 4. Inbound Shipment Reconciliation Join
print("\n--- 4. Inbound Shipment Reconciliation Join: Shipment -> PO -> Supplier ---");
const shipmentReconciliation = dbInstance.shipments.aggregate([
  { $match: { shipment_id: 1 } },
  {
    $lookup: {
      from: "purchase_orders",
      localField: "po_id",
      foreignField: "po_id",
      as: "po"
    }
  },
  { $unwind: "$po" },
  {
    $lookup: {
      from: "suppliers",
      localField: "po.supplier_id",
      foreignField: "supplier_id",
      as: "supplier"
    }
  },
  { $unwind: "$supplier" },
  {
    $project: {
      _id: 0,
      tracking_number: 1,
      carrier: 1,
      shipment_status: "$status",
      po_number: "$po.po_number",
      supplier_name: "$supplier.supplier_name",
      items_received: "$items"
    }
  }
]).toArray();
printjson(shipmentReconciliation);

print(`\n$lookup join demonstrations completed successfully!`);
