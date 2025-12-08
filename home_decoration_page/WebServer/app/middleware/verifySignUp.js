const db = require("../models");
const ROLES = ["user", "admin"]; // Valid roles (can also fetch from database if dynamic)
const User = db.user;

// Check if the username or email already exists in the database
const checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Check for duplicate username
  User.findOne({
    where: { username: req.body.username },
  }).then((user) => {
    if (user) {
      res.status(400).send({
        message: "Failed! Username is already in use!",
      });
      return;
    }

    // Check for duplicate email
    User.findOne({
      where: { email: req.body.email },
    }).then((user) => {
      if (user) {
        res.status(400).send({
          message: "Failed! Email is already in use!",
        });
        return;
      }
      next(); // Proceed to the next middleware if validation passes
    });
  });
};

// Check if roles in the request body are valid
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: "Failed! Role does not exist = " + req.body.roles[i],
        });
        return;
      }
    }
  }
  next(); // Proceed to the next middleware if validation passes
};

// Export the middleware functions as an object
const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
