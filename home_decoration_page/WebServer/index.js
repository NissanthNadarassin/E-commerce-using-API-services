const express = require("express");
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const rateLimit = require("express-rate-limit"); // Rate limiting
const xss = require("xss-clean"); // XSS Protection
const db = require("./db"); // Import from new db.js
const Role = db.Role; // Access the Role model

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

// Seeders
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
const hpp = require("hpp"); // Prevent HTTP Parameter Pollution
app.use(hpp());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter); // Apply global rate limiting

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Restrict to frontend
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data Sanitization against XSS
app.use(xss());

// --- GraphQL Setup ---
const { graphqlHTTP } = require('express-graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./app/graphql/schema');
const resolvers = require('./app/graphql/resolvers');
const createLoaders = require('./app/graphql/loaders');
const attachDirectives = require('./app/graphql/directives');
const jwt = require("jsonwebtoken");
const config = require("./app/config/auth.config");

// Loose Auth Middleware for GraphQL context
app.use((req, res, next) => {
    const token = req.headers["x-access-token"];
    if (token) {
        try {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (!err && decoded) {
                    req.userId = decoded.id;
                }
                next();
            });
        } catch (e) {
            next();
        }
    } else {
        next();
    }
});

let schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers
});

// Attach directives (if any)
schema = attachDirectives(schema);

const depthLimit = require('graphql-depth-limit');

app.use(
    '/graphql',
    graphqlHTTP((req) => ({
        schema: schema,
        graphiql: true,
        context: {
            userId: req.userId,
            loaders: createLoaders() // Create new loaders for every request
        },
        validationRules: [depthLimit(5)], // Limit query depth to 5
    }))
);

// --- REST Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/warehouses", warehouseRoutes);
require("./app/routes/paymentRoutes")(app);
recommendationRoutes(app);

// Define the initial function to seed roles
async function initial() {
    try {
        const roleCount = await Role.count();
        if (roleCount === 0) {
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

// Database Connection and Seeding
// Note: In production you might not want to sync force true every time.
db.sequelize.sync({ force: true })
    .then(async () => {
        console.log("Database synchronized successfully!");
        await initial();
        console.log("Seeding data...");
        await seedAdmin();
        await seedWarehouses();
        await seedProducts();
        await seedUsers();
        await seedUser_address();
        await seedInventory();
        await seedReviews();
        // seedOrders typically depends on Users and Products
        await seedOrders();
        await seedOrderItems();
        console.log("All data seeded successfully!");

        // Test server route
        app.get("/", (req, res) => {
            res.json({ message: "Welcome to the Home Decoration API (Refactored)!" });
        });

        // Start the server
        const PORT = process.env.PORT || 5002;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch((err) => {
        console.error("Error syncing database:", err.message);
    });

// Server start moved inside db sync

