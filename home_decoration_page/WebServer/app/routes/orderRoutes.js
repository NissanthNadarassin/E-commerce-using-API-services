const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authJwt } = require("../middleware");

// User routes - authenticated users only
// Create a new order
router.post("/", [authJwt.verifyToken], orderController.createOrder);

// Get all orders for logged-in user
router.get("/", [authJwt.verifyToken], orderController.getUserOrders);

// Get specific order by ID (user's own order)
router.get("/:id", [authJwt.verifyToken], orderController.getOrderById);

// Cancel order (user's own pending order)
router.put("/:id/cancel", [authJwt.verifyToken], orderController.cancelOrder);

// Admin routes
// Get all orders (Admin only)
router.get("/admin/all", [authJwt.verifyToken, authJwt.isAdmin], orderController.getAllOrders);

// Update order status (Admin only)
router.put("/admin/:id/status", [authJwt.verifyToken, authJwt.isAdmin], orderController.updateOrderStatus);

module.exports = router;
