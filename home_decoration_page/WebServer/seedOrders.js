const db = require("./app/models");
const Order = db.order;
const User = db.user;
const UserAddress = db.userAddress;

const orders = [
  { userId: 1, total_amount: 1299.98, status: "completed", shippingAddressId: 1, billingAddressId: 1 },
  { userId: 2, total_amount: 899.99, status: "processing", shippingAddressId: 2, billingAddressId: 2 },
  { userId: 3, total_amount: 549.97, status: "completed", shippingAddressId: 3, billingAddressId: 3 },
  { userId: 4, total_amount: 2199.96, status: "pending", shippingAddressId: 4, billingAddressId: 4 },
  { userId: 5, total_amount: 1599.98, status: "completed", shippingAddressId: 5, billingAddressId: 5 },
  { userId: 6, total_amount: 799.99, status: "completed", shippingAddressId: 6, billingAddressId: 6 },
  { userId: 7, total_amount: 1099.98, status: "processing", shippingAddressId: 7, billingAddressId: 7 },
  { userId: 8, total_amount: 649.98, status: "completed", shippingAddressId: 8, billingAddressId: 8 },
  { userId: 9, total_amount: 1799.97, status: "cancelled", shippingAddressId: 9, billingAddressId: 9 },
  { userId: 10, total_amount: 999.99, status: "completed", shippingAddressId: 10, billingAddressId: 10 },
  { userId: 11, total_amount: 1449.97, status: "processing", shippingAddressId: 11, billingAddressId: 11 },
  { userId: 12, total_amount: 849.98, status: "completed", shippingAddressId: 12, billingAddressId: 12 },
  { userId: 13, total_amount: 1999.96, status: "pending", shippingAddressId: 13, billingAddressId: 13 },
  { userId: 14, total_amount: 599.99, status: "completed", shippingAddressId: 14, billingAddressId: 14 },
  { userId: 15, total_amount: 1299.97, status: "completed", shippingAddressId: 15, billingAddressId: 15 },
  { userId: 1, total_amount: 449.99, status: "pending", shippingAddressId: 1, billingAddressId: 1 },
  { userId: 3, total_amount: 1899.98, status: "completed", shippingAddressId: 3, billingAddressId: 3 },
  { userId: 5, total_amount: 349.99, status: "processing", shippingAddressId: 5, billingAddressId: 5 },
  { userId: 7, total_amount: 2499.96, status: "completed", shippingAddressId: 7, billingAddressId: 7 },
  { userId: 9, total_amount: 699.99, status: "cancelled", shippingAddressId: 9, billingAddressId: 9 },
];

async function seedOrders() {
  try {
    console.log("Starting order seeding...");

    // Check if orders already exist
    const existingCount = await Order.count();
    if (existingCount > 0) {
      console.log(`${existingCount} orders already exist. Skipping order seeding.`);
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const orderData of orders) {
      // Verify user exists
      const user = await User.findByPk(orderData.userId);
      if (!user) {
        console.log(`User with ID ${orderData.userId} not found. Skipping order...`);
        skippedCount++;
        continue;
      }

      // Verify addresses exist if provided
      if (orderData.shippingAddressId) {
        const shippingAddress = await UserAddress.findByPk(orderData.shippingAddressId);
        if (!shippingAddress) {
          console.log(`Shipping address with ID ${orderData.shippingAddressId} not found. Setting to null...`);
          orderData.shippingAddressId = null;
        }
      }

      if (orderData.billingAddressId) {
        const billingAddress = await UserAddress.findByPk(orderData.billingAddressId);
        if (!billingAddress) {
          console.log(`Billing address with ID ${orderData.billingAddressId} not found. Setting to null...`);
          orderData.billingAddressId = null;
        }
      }

      await Order.create(orderData);
      createdCount++;
      console.log(`Order #${createdCount} for user ${orderData.userId} created successfully (${orderData.status})`);
    }

    console.log(`Order seeding completed! Created ${createdCount} orders, skipped ${skippedCount}.`);
  } catch (error) {
    console.error("Error seeding orders:", error.message);
  }
}

module.exports = seedOrders;
