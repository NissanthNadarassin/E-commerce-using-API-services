const db = require("./app/models");

async function seedInventory() {
  try {
    await db.sequelize.authenticate();
    console.log("Connection established successfully.");

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
          warehouseId: 1,
          quantity_available: 100 // Initial stock
        });
        console.log(`Created inventory for product ${product.id}: ${product.product_name}`);
      } else {
        console.log(`Inventory already exists for product ${product.id}`);
      }
    }

    console.log("Inventory seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding inventory:", error);
    process.exit(1);
  }
}

seedInventory();
