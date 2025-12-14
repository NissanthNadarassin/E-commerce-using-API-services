const express = require("express");
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const rateLimit = require("express-rate-limit"); // Rate limiting
const xss = require("xss-clean"); // XSS Protection
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
const paymentRoutes = require("./app/routes/paymentRoutes");
const recommendationRoutes = require("./app/routes/recommendationRoutes"); // Import AI routes

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

// Security Middleware
app.use(helmet()); // Set security headers
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter); // Apply rate limiting globally

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data Sanitization against XSS
app.use(xss());


const { graphqlHTTP } = require('express-graphql');
const schema = require('./app/graphql/schema');
const jwt = require("jsonwebtoken");
const config = require("./app/config/auth.config");

// Use routes
app.use("/api/auth", authRoutes); // Routes for authentication
app.use("/api/products", productRoutes); // Product routes
app.use("/api/users", userRoutes); // User routes
app.use("/api/orders", orderRoutes); // Order routes
app.use("/api/inventory", inventoryRoutes); // Inventory routes
app.use("/api/reviews", reviewRoutes); // Review routes
app.use("/api/warehouses", warehouseRoutes); // Warehouse routes
require("./app/routes/paymentRoutes")(app); // Payment routes
recommendationRoutes(app); // Register AI routes

// --- GraphQL Setup ---

// Loose Auth Middleware for GraphQL
app.use((req, res, next) => {
  const token = req.headers["x-access-token"];
  if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (!err && decoded) {
        req.userId = decoded.id;
      }
      next();
    });
  } else {
    next();
  }
});

const depthLimit = require('graphql-depth-limit');

app.use(
  '/graphql',
  graphqlHTTP((req) => ({
    schema: schema,
    graphiql: true,
    context: {
      userId: req.userId
    },
    validationRules: [depthLimit(5)], // Limit query depth to 5
  }))
);

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
