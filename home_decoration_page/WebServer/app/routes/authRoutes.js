const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifySignUp = require("../middleware/verifySignUp");

// Registration route with middleware
router.post(
  "/register",
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.register
);

// Alternative registration endpoint
router.post(
  "/signup",
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  authController.register
);

// Login route
router.post("/login", authController.signin);

// Alternative login endpoint
router.post("/signin", authController.signin);

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
