const express = require("express");
const router = express.Router();
const warehouseController = require("../controllers/warehouseController");
const { authJwt } = require("../middleware");

// Get all warehouses (admin only)
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], warehouseController.getAllWarehouses);

// Get warehouse by ID (admin only)
router.get("/:id", [authJwt.verifyToken, authJwt.isAdmin], warehouseController.getWarehouseById);

// Create new warehouse (admin only)
router.post("/", [authJwt.verifyToken, authJwt.isAdmin], warehouseController.createWarehouse);

// Update warehouse (admin only)
router.put("/:id", [authJwt.verifyToken, authJwt.isAdmin], warehouseController.updateWarehouse);

// Delete warehouse (admin only)
router.delete("/:id", [authJwt.verifyToken, authJwt.isAdmin], warehouseController.deleteWarehouse);

module.exports = router;
