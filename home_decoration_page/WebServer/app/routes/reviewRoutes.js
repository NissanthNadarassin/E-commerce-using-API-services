const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authJwt } = require("../middleware");

// Public route - anyone can view reviews
router.get("/product/:productId", reviewController.getProductReviews);

// User routes - authenticated users only
// Get own reviews
router.get("/my-reviews", [authJwt.verifyToken], reviewController.getUserReviews);

// Add review for a product
router.post("/product/:productId", [authJwt.verifyToken], reviewController.addReview);

// Update own review
router.put("/:id", [authJwt.verifyToken], reviewController.updateOwnReview);

// Delete own review
router.delete("/:id", [authJwt.verifyToken], reviewController.deleteOwnReview);

// Admin routes - manage any review
// Update any review
router.put("/admin/:id", [authJwt.verifyToken, authJwt.isAdmin], reviewController.adminUpdateReview);

// Delete any review
router.delete("/admin/:id", [authJwt.verifyToken, authJwt.isAdmin], reviewController.adminDeleteReview);

module.exports = router;
