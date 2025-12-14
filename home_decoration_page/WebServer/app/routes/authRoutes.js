
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifySignUp = require("../middleware/verifySignUp");
const authLimiter = require("../middleware/authLimiter");
const { check, validationResult } = require("express-validator");

// Validation Rules
const registerValidation = [
  check("username", "Username is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password must be at least 6 characters").isLength({ min: 6 })
];

const loginValidation = [
  check("email", "Please include a valid email").optional().isEmail(),
  check("username", "Username is required").optional().not().isEmpty(),
  check("password", "Password is required").exists()
];

// Helper to handle validation errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registration route with middleware
router.post(
  "/register",
  authLimiter,
  registerValidation,
  checkValidation,
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.register
);

// Alternative registration endpoint
router.post(
  "/signup",
  authLimiter,
  registerValidation,
  checkValidation,
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.register
);

// Login route
router.post("/login", authLimiter, loginValidation, checkValidation, authController.signin);

// Alternative login endpoint
router.post("/signin", authLimiter, loginValidation, checkValidation, authController.signin);

router.delete("/users", (req, res) => {
  User.destroy({
    where: {}, // Deletes all rows
    truncate: true, // Optional: Resets primary key auto-increment
  })
    .then(() => {
      res.send({ message: "All users were deleted successfully!" });
    })
    .catch((err) => {
      res.status(500).send({ message: "Error deleting all users." });
    });
});

module.exports = router;
