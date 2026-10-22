/**
 * SmartRetail DA3 — Aggregation Pipeline Demonstrations
 * Script: da3_mongodb/queries/aggregation_examples.js
 * Description: Demonstrates core aggregation pipeline stages:
 *              $match, $unwind, $group, $project, $sort, $addFields, $lookup, $count,
 *              $sum, $avg.
 */

const dbName = "smartretail_db";
const dbInstance = db.getSiblingDB(dbName);

print(`=========================================================================`);
print(`SmartRetail Aggregation Pipeline Demonstrations on: ${dbName}`);
print(`=========================================================================`);

// Pipeline 1: Revenue by Product Category (Unwinds items, joins products, groups by category)
print("\n--- Pipeline 1: Revenue & Units Sold by Product Category ---");
print("Stages used: $match, $unwind, $lookup, $group, $project, $sort");
const categoryRevenuePipeline = [
  { $match: { status: "COMPLETED" } },
  { $unwind: "$items" },
  {
    $lookup: {
      from: "products",
      localField: "items.product_id",
      foreignField: "product_id",
      as: "product_details"
    }
  },
  { $unwind: "$product_details" },
  {
    $group: {
      _id: "$product_details.category_name",
      total_revenue: { $sum: "$items.subtotal" },
      total_units_sold: { $sum: "$items.quantity_sold" },
      average_unit_price: { $avg: "$items.unit_price" },
      transaction_count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      category_name: "$_id",
      total_revenue: { $round: ["$total_revenue", 2] },
      total_units_sold: 1,
      average_unit_price: { $round: ["$average_unit_price", 2] },
      transaction_count: 1
    }
  },
  { $sort: { total_revenue: -1 } }
];
printjson(dbInstance.sales_transactions.aggregate(categoryRevenuePipeline).toArray());

// Pipeline 2: Top Selling Products with $addFields and $project
print("\n--- Pipeline 2: Best-Selling Products Leaderboard ---");
print("Stages used: $unwind, $group, $lookup, $addFields, $project, $sort, $limit");
const bestSellersPipeline = [
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.product_id",
      product_name: { $first: "$items.product_name" },
      total_quantity_sold: { $sum: "$items.quantity_sold" },
      total_sales_value: { $sum: "$items.subtotal" }
    }
  },
  {
    $addFields: {
      sales_contribution_badge: {
        $cond: { if: { $gte: ["$total_sales_value", 300] }, then: "HIGH_VOLUME", else: "STANDARD" }
      }
    }
  },
  {
    $project: {
      _id: 0,
      product_id: "$_id",
      product_name: 1,
      total_quantity_sold: 1,
      total_sales_value: { $round: ["$total_sales_value", 2] },
      sales_contribution_badge: 1
    }
  },
  { $sort: { total_quantity_sold: -1, total_sales_value: -1 } },
  { $limit: 5 }
];
printjson(dbInstance.sales_transactions.aggregate(bestSellersPipeline).toArray());

// Pipeline 3: Total Inventory Valuation Across Warehouses and Shelves
print("\n--- Pipeline 3: Total Stock and Valuation by Location Type ---");
print("Stages used: $lookup, $unwind, $group, $project, $sort");
const stockValuationPipeline = [
  {
    $lookup: {
      from: "products",
      localField: "product_id",
      foreignField: "product_id",
      as: "prod"
    }
  },
  { $unwind: "$prod" },
  {
    $lookup: {
      from: "inventory_locations",
      localField: "location_id",
      foreignField: "location_id",
      as: "loc"
    }
  },
  { $unwind: "$loc" },
  {
    $group: {
      _id: "$loc.location_type",
      location_count: { $addToSet: "$loc.location_id" },
      total_units: { $sum: "$quantity_on_hand" },
      total_inventory_value: {
        $sum: { $multiply: ["$quantity_on_hand", "$prod.standard_unit_price"] }
      },
      average_units_per_sku: { $avg: "$quantity_on_hand" }
    }
  },
  {
    $project: {
      _id: 0,
      location_type: "$_id",
      active_locations: { $size: "$location_count" },
      total_units: 1,
      total_inventory_value: { $round: ["$total_inventory_value", 2] },
      average_units_per_sku: { $round: ["$average_units_per_sku", 2] }
    }
  },
  { $sort: { total_inventory_value: -1 } }
];
printjson(dbInstance.inventory_stock.aggregate(stockValuationPipeline).toArray());

// Pipeline 4: Payment Tender Breakdown using $count and $group
print("\n--- Pipeline 4: Payment Settlement Breakdown by Payment Method ---");
const paymentBreakdownPipeline = [
  {
    $group: {
      _id: "$payment_method",
      total_collected: { $sum: "$amount" },
      transaction_count: { $sum: 1 },
      average_transaction_amount: { $avg: "$amount" }
    }
  },
  {
    $project: {
      _id: 0,
      payment_method: "$_id",
      total_collected: { $round: ["$total_collected", 2] },
      transaction_count: 1,
      average_transaction_amount: { $round: ["$average_transaction_amount", 2] }
    }
  },
  { $sort: { total_collected: -1 } }
];
printjson(dbInstance.payments.aggregate(paymentBreakdownPipeline).toArray());

print(`\nAggregation pipelines executed successfully!`);
