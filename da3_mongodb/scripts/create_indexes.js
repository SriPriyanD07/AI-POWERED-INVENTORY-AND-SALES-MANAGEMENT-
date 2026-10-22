/**
 * SmartRetail DA3 — MongoDB Index Creation Script
 * Script: scripts/create_indexes.js
 * Description: Builds primary unique indexes, compound domain indexes, and
 *              query-optimizing indexes across all 14 SmartRetail collections.
 */

const dbName = "smartretail_db";
const dbInstance = db.getSiblingDB(dbName);

print(`=========================================================================`);
print(`Creating Indexes on database: ${dbName}`);
print(`=========================================================================`);

// 1. customers indexes
print("Creating indexes on 'customers'...");
dbInstance.customers.createIndex({ customer_id: 1 }, { unique: true, name: "uk_customer_id" });
dbInstance.customers.createIndex({ email: 1 }, { unique: true, name: "uk_customer_email" });
dbInstance.customers.createIndex({ membership_type: 1 }, { name: "idx_customer_membership" });
dbInstance.customers.createIndex({ phone_numbers: 1 }, { name: "idx_customer_phones" });

// 2. employees indexes
print("Creating indexes on 'employees'...");
dbInstance.employees.createIndex({ employee_id: 1 }, { unique: true, name: "uk_employee_id" });
dbInstance.employees.createIndex({ email: 1 }, { unique: true, name: "uk_employee_email" });
dbInstance.employees.createIndex({ role: 1 }, { name: "idx_employee_role" });

// 3. product_categories indexes
print("Creating indexes on 'product_categories'...");
dbInstance.product_categories.createIndex({ category_id: 1 }, { unique: true, name: "uk_category_id" });
dbInstance.product_categories.createIndex({ category_name: 1 }, { unique: true, name: "uk_category_name" });
dbInstance.product_categories.createIndex({ parent_category_id: 1 }, { name: "idx_cat_parent" });

// 4. products indexes
print("Creating indexes on 'products'...");
dbInstance.products.createIndex({ product_id: 1 }, { unique: true, name: "uk_product_id" });
dbInstance.products.createIndex({ sku: 1 }, { unique: true, name: "uk_product_sku" });
dbInstance.products.createIndex({ barcode: 1 }, { unique: true, name: "uk_product_barcode" });
dbInstance.products.createIndex({ category_id: 1 }, { name: "idx_product_category" });
dbInstance.products.createIndex({ product_name: "text", description: "text" }, { name: "idx_product_text_search" });

// 5. suppliers indexes
print("Creating indexes on 'suppliers'...");
dbInstance.suppliers.createIndex({ supplier_id: 1 }, { unique: true, name: "uk_supplier_id" });
dbInstance.suppliers.createIndex({ email: 1 }, { unique: true, name: "uk_supplier_email" });
dbInstance.suppliers.createIndex({ gst_number: 1 }, { unique: true, name: "uk_supplier_gst" });
dbInstance.suppliers.createIndex({ phone_numbers: 1 }, { name: "idx_supplier_phones" });

// 6. inventory_locations indexes
print("Creating indexes on 'inventory_locations'...");
dbInstance.inventory_locations.createIndex({ location_id: 1 }, { unique: true, name: "uk_location_id" });
dbInstance.inventory_locations.createIndex({ location_code: 1 }, { unique: true, name: "uk_location_code" });
dbInstance.inventory_locations.createIndex({ location_type: 1 }, { name: "idx_loc_type" });
dbInstance.inventory_locations.createIndex({ parent_location_id: 1 }, { name: "idx_loc_parent" });

// 7. inventory_stock indexes
print("Creating indexes on 'inventory_stock'...");
// Compound Unique Index: prevents duplicate stock record for the same location and product
dbInstance.inventory_stock.createIndex({ location_id: 1, product_id: 1 }, { unique: true, name: "uk_stock_loc_prod" });
dbInstance.inventory_stock.createIndex({ product_id: 1 }, { name: "idx_stock_product" });
dbInstance.inventory_stock.createIndex({ quantity_on_hand: 1 }, { name: "idx_stock_qoh" });

// 8. inventory_transactions indexes
print("Creating indexes on 'inventory_transactions'...");
dbInstance.inventory_transactions.createIndex({ transaction_id: 1 }, { unique: true, name: "uk_inv_txn_id" });
dbInstance.inventory_transactions.createIndex({ product_id: 1, transaction_date: -1 }, { name: "idx_itxn_prod_date" });
dbInstance.inventory_transactions.createIndex({ location_id: 1 }, { name: "idx_itxn_location" });
dbInstance.inventory_transactions.createIndex({ reference_type: 1, reference_id: 1 }, { name: "idx_itxn_reference" });

// 9. purchase_orders indexes
print("Creating indexes on 'purchase_orders'...");
dbInstance.purchase_orders.createIndex({ po_id: 1 }, { unique: true, name: "uk_po_id" });
dbInstance.purchase_orders.createIndex({ po_number: 1 }, { unique: true, name: "uk_po_number" });
dbInstance.purchase_orders.createIndex({ supplier_id: 1 }, { name: "idx_po_supplier" });
dbInstance.purchase_orders.createIndex({ status: 1 }, { name: "idx_po_status" });
dbInstance.purchase_orders.createIndex({ "items.product_id": 1 }, { name: "idx_po_item_product" });

// 10. shipments indexes
print("Creating indexes on 'shipments'...");
dbInstance.shipments.createIndex({ shipment_id: 1 }, { unique: true, name: "uk_shipment_id" });
dbInstance.shipments.createIndex({ tracking_number: 1 }, { unique: true, name: "uk_shipment_tracking" });
dbInstance.shipments.createIndex({ po_id: 1 }, { name: "idx_shipment_po" });
dbInstance.shipments.createIndex({ status: 1 }, { name: "idx_shipment_status" });

// 11. sales_transactions indexes
print("Creating indexes on 'sales_transactions'...");
dbInstance.sales_transactions.createIndex({ transaction_id: 1 }, { unique: true, name: "uk_sales_txn_id" });
dbInstance.sales_transactions.createIndex({ receipt_number: 1 }, { unique: true, name: "uk_sales_receipt" });
dbInstance.sales_transactions.createIndex({ customer_id: 1 }, { name: "idx_sales_customer" });
dbInstance.sales_transactions.createIndex({ cashier_id: 1 }, { name: "idx_sales_cashier" });
dbInstance.sales_transactions.createIndex({ transaction_date: -1 }, { name: "idx_sales_date" });
dbInstance.sales_transactions.createIndex({ "items.product_id": 1 }, { name: "idx_sales_item_product" });

// 12. payments indexes
print("Creating indexes on 'payments'...");
dbInstance.payments.createIndex({ payment_id: 1 }, { unique: true, name: "uk_payment_id" });
dbInstance.payments.createIndex({ transaction_id: 1 }, { name: "idx_payment_txn" });
dbInstance.payments.createIndex({ payment_method: 1 }, { name: "idx_payment_method" });
dbInstance.payments.createIndex({ status: 1 }, { name: "idx_payment_status" });

// 13. restock_events indexes
print("Creating indexes on 'restock_events'...");
dbInstance.restock_events.createIndex({ restock_id: 1 }, { unique: true, name: "uk_restock_id" });
dbInstance.restock_events.createIndex({ product_id: 1 }, { name: "idx_restock_product" });
dbInstance.restock_events.createIndex({ to_location_id: 1, status: 1 }, { name: "idx_restock_loc_status" });

// 14. reorder_triggers indexes
print("Creating indexes on 'reorder_triggers'...");
dbInstance.reorder_triggers.createIndex({ trigger_id: 1 }, { unique: true, name: "uk_trigger_id" });
dbInstance.reorder_triggers.createIndex({ product_id: 1, location_id: 1, status: 1 }, { name: "idx_trigger_prod_loc_status" });

print("All unique, compound, and performance indexes created successfully!");
