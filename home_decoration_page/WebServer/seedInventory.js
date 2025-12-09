const db = require("./app/models");

async function seedInventory() {
  try {
    // Connection established in server.js

    // Get all products and warehouses
    const products = await db.products.findAll();
    const warehouses = await db.warehouse.findAll();

    console.log(`Found ${products.length} products. Creating inventory records...`);

    for (const product of products) {
      // Distribute each product across all warehouses
      for (const warehouse of warehouses) {
        // Check if inventory exists for this product-warehouse combination
        const existingInventory = await db.inventory.findOne({
          where: { 
            productId: product.id,
            warehouseId: warehouse.id
          }
        });

        if (!existingInventory) {
          // Random quantity between 1 and 10
          const randomQuantity = Math.floor(Math.random() * 10) + 1;
          
          await db.inventory.create({
            productId: product.id,
            warehouseId: warehouse.id,
            quantity_available: randomQuantity
          });
          console.log(`Created inventory for product ${product.id}: ${product.product_name} in warehouse ${warehouse.id} (${warehouse.location}) - Qty: ${randomQuantity}`);
        } else {
          console.log(`Inventory already exists for product ${product.id} in warehouse ${warehouse.id}`);
        }
      }
    }

    console.log("Inventory seeding completed!");
  } catch (error) {
    console.error("Error seeding inventory:", error);
  }
}

module.exports = seedInventory;
