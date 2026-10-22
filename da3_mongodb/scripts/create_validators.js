/**
 * SmartRetail DA3 — MongoDB JSON Schema Validators
 * Script: scripts/create_validators.js
 * Description: Defines strict JSON Schema validation rules across SmartRetail collections
 *              matching Oracle DA2 constraints (NOT NULL, CHECK, Domain rules).
 */

const dbName = "smartretail_db";
const dbInstance = db.getSiblingDB(dbName);

print(`=========================================================================`);
print(`Applying JSON Schema Validators to database: ${dbName}`);
print(`=========================================================================`);

function createOrUpdateCollection(collectionName, validatorDoc) {
  const existingColls = dbInstance.getCollectionNames();
  if (existingColls.includes(collectionName)) {
    print(`Modifying validator for existing collection: ${collectionName}`);
    dbInstance.runCommand({
      collMod: collectionName,
      validator: validatorDoc,
      validationLevel: "strict",
      validationAction: "error"
    });
  } else {
    print(`Creating collection with validator: ${collectionName}`);
    dbInstance.createCollection(collectionName, {
      validator: validatorDoc,
      validationLevel: "strict",
      validationAction: "error"
    });
  }
}

// 1. customers validator
createOrUpdateCollection("customers", {
  $jsonSchema: {
    bsonType: "object",
    required: ["customer_id", "first_name", "last_name", "email", "loyalty_points"],
    properties: {
      customer_id: { bsonType: "int", description: "Unique integer identifier for customer" },
      first_name: { bsonType: "string", description: "Customer first name" },
      last_name: { bsonType: "string", description: "Customer last name" },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        description: "Valid customer email address"
      },
      phone_numbers: {
        bsonType: "array",
        items: { bsonType: "string" },
        description: "Array of customer phone contact numbers"
      },
      loyalty_points: {
        bsonType: "int",
        minimum: 0,
        description: "Non-negative loyalty points balance"
      },
      membership_type: {
        enum: ["REGULAR", "SILVER", "GOLD", "PLATINUM", null],
        description: "Customer membership tier"
      },
      registered_date: { bsonType: ["date", "null"] }
    }
  }
});

// 2. employees validator
createOrUpdateCollection("employees", {
  $jsonSchema: {
    bsonType: "object",
    required: ["employee_id", "full_name", "role", "email", "hire_date"],
    properties: {
      employee_id: { bsonType: "int" },
      full_name: { bsonType: "string" },
      role: {
        enum: ["CASHIER", "MANAGER", "PROCUREMENT_OFFICER", "WAREHOUSE_STAFF", "ADMIN"],
        description: "Store personnel role segregation"
      },
      email: { bsonType: "string" },
      phone: { bsonType: ["string", "null"] },
      hire_date: { bsonType: "date" }
    }
  }
});

// 3. product_categories validator
createOrUpdateCollection("product_categories", {
  $jsonSchema: {
    bsonType: "object",
    required: ["category_id", "category_name"],
    properties: {
      category_id: { bsonType: "int" },
      category_name: { bsonType: "string" },
      parent_category_id: { bsonType: ["int", "null"] },
      category_path: { bsonType: ["string", "null"] }
    }
  }
});

// 4. products validator
createOrUpdateCollection("products", {
  $jsonSchema: {
    bsonType: "object",
    required: ["product_id", "sku", "barcode", "product_name", "category_id", "unit_of_measure", "standard_unit_price", "is_active"],
    properties: {
      product_id: { bsonType: "int" },
      sku: { bsonType: "string" },
      barcode: { bsonType: "string" },
      product_name: { bsonType: "string" },
      description: { bsonType: ["string", "null"] },
      category_id: { bsonType: "int" },
      category_name: { bsonType: ["string", "null"] },
      unit_of_measure: { bsonType: "string" },
      standard_unit_price: {
        bsonType: ["double", "int", "decimal"],
        minimum: 0.01,
        description: "Standard retail price must be strictly positive"
      },
      is_active: {
        enum: ["TRUE", "FALSE", true, false],
        description: "Active product flag"
      }
    }
  }
});

// 5. suppliers validator
createOrUpdateCollection("suppliers", {
  $jsonSchema: {
    bsonType: "object",
    required: ["supplier_id", "supplier_name", "email", "gst_number"],
    properties: {
      supplier_id: { bsonType: "int" },
      supplier_name: { bsonType: "string" },
      contact_person: { bsonType: ["string", "null"] },
      email: { bsonType: "string" },
      gst_number: { bsonType: "string" },
      phone_numbers: {
        bsonType: "array",
        items: { bsonType: "string" }
      },
      address: {
        bsonType: "object",
        properties: {
          street: { bsonType: ["string", "null"] },
          city: { bsonType: ["string", "null"] },
          state: { bsonType: ["string", "null"] },
          pincode: { bsonType: ["string", "null"] }
        }
      },
      rating: {
        bsonType: ["double", "int", "decimal", "null"],
        minimum: 1.0,
        maximum: 5.0,
        description: "Supplier rating between 1.00 and 5.00"
      },
      created_at: { bsonType: "date" }
    }
  }
});

// 6. inventory_locations validator
createOrUpdateCollection("inventory_locations", {
  $jsonSchema: {
    bsonType: "object",
    required: ["location_id", "location_code", "location_type", "location_name"],
    properties: {
      location_id: { bsonType: "int" },
      location_code: { bsonType: "string" },
      location_type: {
        enum: ["WAREHOUSE", "SHELF"],
        description: "Physical storage type segregation"
      },
      location_name: { bsonType: "string" },
      parent_location_id: { bsonType: ["int", "null"] },
      capacity: { bsonType: ["int", "null"], minimum: 1 },
      aisle_number: { bsonType: ["string", "null"] },
      zone: { bsonType: ["string", "null"] }
    }
  }
});

// 7. inventory_stock validator
createOrUpdateCollection("inventory_stock", {
  $jsonSchema: {
    bsonType: "object",
    required: ["location_id", "product_id", "quantity_on_hand", "reorder_threshold", "reorder_quantity"],
    properties: {
      location_id: { bsonType: "int" },
      product_id: { bsonType: "int" },
      quantity_on_hand: {
        bsonType: "int",
        minimum: 0,
        description: "Stock quantity cannot drop below zero"
      },
      reorder_threshold: {
        bsonType: "int",
        minimum: 0,
        description: "Safety reorder threshold"
      },
      reorder_quantity: {
        bsonType: "int",
        minimum: 1,
        description: "Standard replenishment batch quantity"
      },
      last_updated_at: { bsonType: "date" }
    }
  }
});

// 8. inventory_transactions validator
createOrUpdateCollection("inventory_transactions", {
  $jsonSchema: {
    bsonType: "object",
    required: ["transaction_id", "product_id", "location_id", "transaction_type", "quantity", "transaction_date"],
    properties: {
      transaction_id: { bsonType: "int" },
      product_id: { bsonType: "int" },
      location_id: { bsonType: "int" },
      transaction_type: {
        enum: ["RECEIPT", "TRANSFER_IN", "TRANSFER_OUT", "SALE", "ADJUSTMENT"],
        description: "Movement type in audit ledger"
      },
      quantity: { bsonType: "int" },
      transaction_date: { bsonType: "date" },
      reference_type: {
        enum: ["SHIPMENT", "RESTOCK", "SALE", "MANUAL", null]
      },
      reference_id: { bsonType: ["int", "null"] }
    }
  }
});

// 9. purchase_orders validator
createOrUpdateCollection("purchase_orders", {
  $jsonSchema: {
    bsonType: "object",
    required: ["po_id", "po_number", "supplier_id", "created_by", "order_date", "status", "items"],
    properties: {
      po_id: { bsonType: "int" },
      po_number: { bsonType: "string" },
      supplier_id: { bsonType: "int" },
      supplier_name: { bsonType: ["string", "null"] },
      created_by: { bsonType: "int" },
      order_date: { bsonType: "date" },
      expected_delivery_date: { bsonType: ["date", "null"] },
      status: {
        enum: ["DRAFT", "PENDING", "APPROVED", "SHIPPED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]
      },
      total_amount: { bsonType: ["double", "int", "decimal"], minimum: 0 },
      is_auto_generated: { enum: ["TRUE", "FALSE", true, false] },
      items: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["product_id", "quantity_ordered", "unit_price"],
          properties: {
            product_id: { bsonType: "int" },
            sku: { bsonType: ["string", "null"] },
            product_name: { bsonType: ["string", "null"] },
            quantity_ordered: { bsonType: "int", minimum: 1 },
            unit_price: { bsonType: ["double", "int", "decimal"], minimum: 0.01 },
            subtotal: { bsonType: ["double", "int", "decimal"] }
          }
        }
      }
    }
  }
});

// 10. shipments validator
createOrUpdateCollection("shipments", {
  $jsonSchema: {
    bsonType: "object",
    required: ["shipment_id", "tracking_number", "po_id", "status", "items"],
    properties: {
      shipment_id: { bsonType: "int" },
      tracking_number: { bsonType: "string" },
      po_id: { bsonType: "int" },
      carrier: { bsonType: ["string", "null"] },
      shipment_date: { bsonType: ["date", "null"] },
      received_date: { bsonType: ["date", "null"] },
      status: {
        enum: ["IN_TRANSIT", "DELIVERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]
      },
      received_by: { bsonType: ["int", "null"] },
      items: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["product_id", "quantity_shipped", "quantity_received"],
          properties: {
            product_id: { bsonType: "int" },
            sku: { bsonType: ["string", "null"] },
            quantity_shipped: { bsonType: "int", minimum: 1 },
            quantity_received: { bsonType: "int", minimum: 0 }
          }
        }
      }
    }
  }
});

// 11. sales_transactions validator
createOrUpdateCollection("sales_transactions", {
  $jsonSchema: {
    bsonType: "object",
    required: ["transaction_id", "receipt_number", "cashier_id", "transaction_date", "total_amount", "status", "items"],
    properties: {
      transaction_id: { bsonType: "int" },
      receipt_number: { bsonType: "string" },
      customer_id: { bsonType: ["int", "null"] },
      customer_name: { bsonType: ["string", "null"] },
      cashier_id: { bsonType: "int" },
      transaction_date: { bsonType: "date" },
      total_amount: { bsonType: ["double", "int", "decimal"], minimum: 0 },
      status: {
        enum: ["COMPLETED", "VOID", "REFUNDED"]
      },
      items: {
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: ["product_id", "shelf_location_id", "quantity_sold", "unit_price"],
          properties: {
            product_id: { bsonType: "int" },
            sku: { bsonType: ["string", "null"] },
            product_name: { bsonType: ["string", "null"] },
            shelf_location_id: { bsonType: "int" },
            shelf_code: { bsonType: ["string", "null"] },
            quantity_sold: { bsonType: "int", minimum: 1 },
            unit_price: { bsonType: ["double", "int", "decimal"], minimum: 0.01 },
            subtotal: { bsonType: ["double", "int", "decimal"] }
          }
        }
      },
      payments: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["payment_id", "payment_method", "amount", "status"],
          properties: {
            payment_id: { bsonType: "int" },
            payment_method: { enum: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "WALLET", "POINTS"] },
            amount: { bsonType: ["double", "int", "decimal"], minimum: 0.01 },
            payment_date: { bsonType: ["date", "null"] },
            reference_number: { bsonType: ["string", "null"] },
            status: { enum: ["SUCCESS", "PENDING", "FAILED", "REFUNDED"] }
          }
        }
      }
    }
  }
});

// 12. payments validator
createOrUpdateCollection("payments", {
  $jsonSchema: {
    bsonType: "object",
    required: ["payment_id", "transaction_id", "payment_method", "amount", "payment_date", "status"],
    properties: {
      payment_id: { bsonType: "int" },
      transaction_id: { bsonType: "int" },
      receipt_number: { bsonType: ["string", "null"] },
      payment_method: {
        enum: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "WALLET", "POINTS"]
      },
      amount: { bsonType: ["double", "int", "decimal"], minimum: 0.01 },
      payment_date: { bsonType: "date" },
      reference_number: { bsonType: ["string", "null"] },
      status: {
        enum: ["SUCCESS", "PENDING", "FAILED", "REFUNDED"]
      }
    }
  }
});

// 13. restock_events validator
createOrUpdateCollection("restock_events", {
  $jsonSchema: {
    bsonType: "object",
    required: ["restock_id", "product_id", "from_location_id", "to_location_id", "quantity_moved", "event_date"],
    properties: {
      restock_id: { bsonType: "int" },
      product_id: { bsonType: "int" },
      product_name: { bsonType: ["string", "null"] },
      from_location_id: { bsonType: "int" },
      to_location_id: { bsonType: "int" },
      quantity_moved: { bsonType: "int", minimum: 1 },
      event_date: { bsonType: "date" },
      triggered_by: { bsonType: ["string", "null"] },
      performed_by: { bsonType: ["int", "null"] },
      status: {
        enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", null]
      }
    }
  }
});

// 14. reorder_triggers validator
createOrUpdateCollection("reorder_triggers", {
  $jsonSchema: {
    bsonType: "object",
    required: ["trigger_id", "product_id", "location_id", "stock_at_trigger", "threshold_at_trigger", "trigger_date"],
    properties: {
      trigger_id: { bsonType: "int" },
      product_id: { bsonType: "int" },
      product_name: { bsonType: ["string", "null"] },
      location_id: { bsonType: "int" },
      stock_at_trigger: { bsonType: "int" },
      threshold_at_trigger: { bsonType: "int" },
      trigger_date: { bsonType: "date" },
      generated_po_id: { bsonType: ["int", "null"] },
      status: {
        enum: ["OPEN", "PO_CREATED", "RESOLVED", "IGNORED", null]
      }
    }
  }
});

print(`All JSON Schema validators successfully configured.`);
