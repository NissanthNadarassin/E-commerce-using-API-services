const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authJwt } = require("../middleware"); // Authentication middleware

// User self-service routes (MUST be before /:id routes to avoid conflicts)
// Update own profile (authenticated users)
router.put("/profile", [authJwt.verifyToken], userController.updateOwnProfile);

// Delete own account (authenticated users)
router.delete("/profile", [authJwt.verifyToken], userController.deleteOwnAccount);

// Get user's addresses (authenticated users)
router.get("/addresses", [authJwt.verifyToken], userController.getUserAddresses);

// Add new address (authenticated users)
router.post("/addresses", [authJwt.verifyToken], userController.addUserAddress);

// Update address (authenticated users)
router.put("/addresses/:id", [authJwt.verifyToken], userController.updateUserAddress);

// Delete address (authenticated users)
router.delete("/addresses/:id", [authJwt.verifyToken], userController.deleteUserAddress);

// Get all users (Admin only)
router.get("/", [authJwt.verifyToken, authJwt.isAdmin], userController.getAllUsers);

// Get a specific user by ID (Admin only)
router.get("/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.getUserById);

// Delete a user by ID (Admin only)
router.delete("/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.deleteUser);

// Block a user (Admin only)
router.put("/block/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.blockUser);

// Unblock a user (Admin only)
router.put("/unblock/:id", [authJwt.verifyToken, authJwt.isAdmin], userController.unblockUser);

module.exports = router;
