const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { authJwt } = require("../middleware");

// Admin routes only - all inventory management requires admin role

// Get all inventory
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], inventoryController.getAllInventory);

// Get low stock products
router.get("/low-stock", [authJwt.verifyToken, authJwt.isAdmin], inventoryController.getLowStockProducts);

// Get inventory for specific product
router.get("/product/:productId", [authJwt.verifyToken, authJwt.isAdmin], inventoryController.getInventoryByProduct);

// Set reorder levels
router.put("/product/:productId/reorder", [authJwt.verifyToken, authJwt.isAdmin], inventoryController.setReorderLevel);

module.exports = router;
