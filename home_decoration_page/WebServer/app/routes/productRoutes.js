const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authJwt } = require("../middleware"); // Import authentication middleware

// Public: Retrieve all products
router.get("/", productController.findAll);

// Public: Retrieve a single product by ID
router.get("/:id", productController.findOne);

// Public: Search products by title
router.get("/search/:title", productController.findByTitle);

// Admin-only: Create a new product
router.post("/", [authJwt.verifyToken, authJwt.isAdmin], productController.create);

// Admin-only: Update a product by ID
router.put("/:id", [authJwt.verifyToken, authJwt.isAdmin], productController.update);

// Admin-only: Delete a product by ID
router.delete("/:id", [authJwt.verifyToken, authJwt.isAdmin], productController.delete);

// Admin-only: Delete all products
router.delete("/", [authJwt.verifyToken, authJwt.isAdmin], productController.deleteAll);

// Add a rating to a product (disabled - ratings feature needs reimplementation)
// router.post("/:id/rating", productController.addRating);

module.exports = router;
