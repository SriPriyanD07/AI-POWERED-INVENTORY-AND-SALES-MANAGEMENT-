/**
 * SmartRetail DA3 — Core CRUD Operations Examples
 * Script: da3_mongodb/queries/crud_examples.js
 * Description: Demonstrates insertOne, insertMany, find, findOne, updateOne,
 *              updateMany, deleteOne, deleteMany using realistic SmartRetail data.
 */

const dbName = "smartretail_db";
const dbInstance = db.getSiblingDB(dbName);

print(`=========================================================================`);
print(`SmartRetail CRUD Operations Demonstration on: ${dbName}`);
print(`=========================================================================`);

// 1. insertOne() — Adding a new Customer
print("\n--- 1. insertOne() Demonstration ---");
const newCustomer = {
  customer_id: 101,
  first_name: "Rohan",
  last_name: "Gupta",
  email: "rohan.gupta@example.com",
  phone_numbers: ["+91-9988112233"],
  loyalty_points: 100,
  membership_type: "REGULAR",
  registered_date: new Date()
};
const insertOneResult = dbInstance.customers.insertOne(newCustomer);
print(`Inserted Customer with _id: ${insertOneResult.insertedId}, ID: 101`);

// 2. insertMany() — Adding multiple New Products
print("\n--- 2. insertMany() Demonstration ---");
const newProducts = [
  {
    product_id: 101,
    sku: "SKU-ORG-001",
    barcode: "8901030099011",
    product_name: "Organic Wild Forest Honey 500g",
    description: "Raw unprocessed multi-floral honey",
    category_id: 5,
    category_name: "Staples & Grains",
    unit_of_measure: "JAR",
    standard_unit_price: 349.00,
    is_active: "TRUE"
  },
  {
    product_id: 102,
    sku: "SKU-ORG-002",
    barcode: "8901030099028",
    product_name: "Cold Pressed Virgin Coconut Oil 500ml",
    description: "Wood pressed pure coconut edible oil",
    category_id: 5,
    category_name: "Staples & Grains",
    unit_of_measure: "BOTTLE",
    standard_unit_price: 245.00,
    is_active: "TRUE"
  }
];
const insertManyResult = dbInstance.products.insertMany(newProducts);
print(`Inserted ${Object.keys(insertManyResult.insertedIds).length} products successfully.`);

// 3. findOne() — Retrieve specific product by SKU with projection
print("\n--- 3. findOne() Demonstration ---");
const productFound = dbInstance.products.findOne(
  { sku: "SKU-DRY-001" },
  { _id: 0, product_id: 1, sku: 1, product_name: 1, standard_unit_price: 1, category_name: 1 }
);
printjson(productFound);

// 4. find() — Retrieve active products in Category 5 with sorting and limit
print("\n--- 4. find() with Sorting and Limit ---");
const productsCursor = dbInstance.products.find(
  { category_id: 5, is_active: "TRUE" },
  { _id: 0, product_id: 1, sku: 1, product_name: 1, standard_unit_price: 1 }
).sort({ standard_unit_price: -1 }).limit(3);
printjson(productsCursor.toArray());

// 5. updateOne() — Update customer loyalty points and upgrade tier
print("\n--- 5. updateOne() Demonstration ---");
const updateOneResult = dbInstance.customers.updateOne(
  { customer_id: 101 },
  {
    $inc: { loyalty_points: 450 },
    $set: { membership_type: "SILVER", last_activity: new Date() }
  }
);
print(`Matched: ${updateOneResult.matchedCount}, Modified: ${updateOneResult.modifiedCount}`);
printjson(dbInstance.customers.findOne({ customer_id: 101 }));

// 6. updateMany() — Mark products below 50.00 with promotional badge
print("\n--- 6. updateMany() Demonstration ---");
const updateManyResult = dbInstance.products.updateMany(
  { standard_unit_price: { $lte: 50.00 } },
  { $set: { promotion_eligible: true } }
);
print(`Updated promotional status for ${updateManyResult.modifiedCount} products.`);

// 7. deleteOne() — Delete the demonstration customer
print("\n--- 7. deleteOne() Demonstration ---");
const deleteOneResult = dbInstance.customers.deleteOne({ customer_id: 101 });
print(`Deleted Customer ID 101. Count: ${deleteOneResult.deletedCount}`);

// 8. deleteMany() — Delete newly added demonstration products
print("\n--- 8. deleteMany() Demonstration ---");
const deleteManyResult = dbInstance.products.deleteMany({ product_id: { $gte: 101 } });
print(`Deleted ${deleteManyResult.deletedCount} demo products.`);

print(`\nCRUD demonstration completed cleanly!`);
