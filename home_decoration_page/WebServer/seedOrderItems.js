const db = require("./app/models");
const OrderItem = db.orderItem;
const Order = db.order;
const Product = db.products;

const orderItems = [
  // Order 1 items
  { orderId: 1, productId: 1, quantity: 1, price: 899.99 },
  { orderId: 1, productId: 5, quantity: 2, price: 199.99 },

  // Order 2 items
  { orderId: 2, productId: 2, quantity: 1, price: 899.99 },

  // Order 3 items
  { orderId: 3, productId: 1, quantity: 1, price: 149.99 },
  { orderId: 3, productId: 2, quantity: 2, price: 199.99 },

  // Order 4 items
  { orderId: 4, productId: 3, quantity: 1, price: 1099.99 },
  { orderId: 4, productId: 4, quantity: 1, price: 1099.99 },

  // Order 5 items
  { orderId: 5, productId: 1, quantity: 1, price: 899.99 },
  { orderId: 5, productId: 7, quantity: 1, price: 699.99 },

  // Order 6 items
  { orderId: 6, productId: 6, quantity: 1, price: 799.99 },

  // Order 7 items
  { orderId: 7, productId: 3, quantity: 1, price: 1099.99 },

  // Order 8 items
  { orderId: 8, productId: 3, quantity: 1, price: 249.99 },
  { orderId: 8, productId: 4, quantity: 2, price: 199.99 },

  // Order 9 items
  { orderId: 9, productId: 1, quantity: 2, price: 899.99 },

  // Order 10 items
  { orderId: 10, productId: 8, quantity: 1, price: 999.99 },

  // Order 11 items
  { orderId: 11, productId: 5, quantity: 1, price: 349.99 },
  { orderId: 11, productId: 6, quantity: 1, price: 1099.99 },

  // Order 12 items
  { orderId: 12, productId: 7, quantity: 1, price: 449.99 },
  { orderId: 12, productId: 8, quantity: 2, price: 199.99 },

  // Order 13 items
  { orderId: 13, productId: 2, quantity: 1, price: 899.99 },
  { orderId: 13, productId: 3, quantity: 1, price: 1099.99 },

  // Order 14 items
  { orderId: 14, productId: 1, quantity: 1, price: 599.99 },

  // Order 15 items
  { orderId: 15, productId: 2, quantity: 1, price: 299.99 },
  { orderId: 15, productId: 4, quantity: 1, price: 999.99 },

  // Order 16 items
  { orderId: 16, productId: 5, quantity: 1, price: 199.99 },
  { orderId: 16, productId: 6, quantity: 1, price: 249.99 },

  // Order 17 items
  { orderId: 17, productId: 1, quantity: 2, price: 899.99 },
  { orderId: 17, productId: 2, quantity: 1, price: 99.99 },

  // Order 18 items
  { orderId: 18, productId: 7, quantity: 1, price: 349.99 },

  // Order 19 items
  { orderId: 19, productId: 2, quantity: 2, price: 899.99 },
  { orderId: 19, productId: 8, quantity: 1, price: 699.99 },

  // Order 20 items
  { orderId: 20, productId: 3, quantity: 1, price: 699.99 },
];

async function seedOrderItems() {
  try {
    console.log("Starting order items seeding...");

    // Check if order items already exist
    const existingCount = await OrderItem.count();
    if (existingCount > 0) {
      console.log(`${existingCount} order items already exist. Skipping order items seeding.`);
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const itemData of orderItems) {
      // Verify order exists
      const order = await Order.findByPk(itemData.orderId);
      if (!order) {
        console.log(`Order with ID ${itemData.orderId} not found. Skipping item...`);
        skippedCount++;
        continue;
      }

      // Verify product exists
      const product = await Product.findByPk(itemData.productId);
      if (!product) {
        console.log(`Product with ID ${itemData.productId} not found. Skipping item...`);
        skippedCount++;
        continue;
      }

      await OrderItem.create(itemData);
      createdCount++;
      console.log(`Order item for order #${itemData.orderId} and product #${itemData.productId} created (qty: ${itemData.quantity})`);
    }

    console.log(`Order items seeding completed! Created ${createdCount} items, skipped ${skippedCount}.`);
  } catch (error) {
    console.error("Error seeding order items:", error.message);
  }
}

module.exports = seedOrderItems;
