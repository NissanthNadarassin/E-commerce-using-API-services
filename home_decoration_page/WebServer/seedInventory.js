const db = require("./app/models");

async function seedInventory() {
  try {
    // Connection established in server.js

    // Get all products
    const products = await db.products.findAll();

    console.log(`Found ${products.length} products. Creating inventory records...`);

    for (const product of products) {
      // Check if inventory exists
      const existingInventory = await db.inventory.findOne({
        where: { productId: product.id }
      });

      if (!existingInventory) {
        await db.inventory.create({
          productId: product.id,
          warehouseId: 1, // Assuming Warehouse Paris (id: 1) exists from seedWarehouses
          quantity_available: 100 // Initial stock
        });
        console.log(`Created inventory for product ${product.id}: ${product.product_name}`);
      } else {
        console.log(`Inventory already exists for product ${product.id}`);
      }
    }

    console.log("Inventory seeding completed!");
  } catch (error) {
    console.error("Error seeding inventory:", error);
  }
}

module.exports = seedInventory;
