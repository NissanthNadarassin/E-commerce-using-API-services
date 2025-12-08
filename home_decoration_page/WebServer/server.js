const express = require("express");
const cors = require("cors");
const db = require("./app/models"); // Import models
const Role = db.role; // Access the Role model

// Import routes
const authRoutes = require("./app/routes/authRoutes");
const productRoutes = require("./app/routes/productRoutes");
const userRoutes = require("./app/routes/userRoutes");
const orderRoutes = require("./app/routes/orderRoutes");
const inventoryRoutes = require("./app/routes/inventoryRoutes");
const reviewRoutes = require("./app/routes/reviewRoutes");
const warehouseRoutes = require("./app/routes/warehouseRoutes");

// Import seed functions
const seedAdmin = require("./seedAdmin");
const seedWarehouses = require("./seedWarehouses");
const seedProducts = require("./seedProducts");
const seedUsers = require("./seedUsers");
const seedInventory = require("./seedInventory");
const seedReviews = require("./seedReviews");
const seedOrders = require("./seedOrders");
const seedOrderItems = require("./seedOrderItems");
const seedUser_address = require("./seedUser_address");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use routes
app.use("/api/auth", authRoutes); // Routes for authentication
app.use("/api/products", productRoutes); // Product routes
app.use("/api/users", userRoutes); // User routes
app.use("/api/orders", orderRoutes); // Order routes
app.use("/api/inventory", inventoryRoutes); // Inventory routes
app.use("/api/reviews", reviewRoutes); // Review routes
app.use("/api/warehouses", warehouseRoutes); // Warehouse routes

// Define the initial function to seed roles
async function initial() {
  try {
    // Check if roles exist
    const roleCount = await Role.count();
    if (roleCount === 0) {
      // Seed roles if none exist
      await Role.bulkCreate([
        { id: 1, name: "user" },
        { id: 2, name: "admin" },
      ]);
      console.log("Roles seeded successfully!");
    } else {
      console.log("Roles already exist. Skipping seeding.");
    }
  } catch (error) {
    console.error("Error seeding roles:", error.message);
  }
}

// Test database connection and sync tables
db.sequelize
  .sync({ force: true }) // Drop and re-create tables
  .then(async () => {
    console.log("Database synchronized successfully!");
    await initial(); // Seed roles after syncing database
    await seedAdmin();
    await seedUsers();
    await seedWarehouses();
    await seedProducts();
    await seedInventory();
    await seedReviews();
    await seedOrders();
    await seedOrderItems();
    await seedUser_address();
    console.log("All data seeded successfully!");
  })
  .catch((err) => {
    console.error("Error syncing database:", err.message);
  });

// Test server route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Home Decoration API!" });
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
