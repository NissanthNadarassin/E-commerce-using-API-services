const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;

// Verify if the token is provided and valid
const verifyToken = (req, res, next) => {
  // Retrieve token from headers
  let token = req.headers["x-access-token"]; // Alternative: req.headers["authorization"]

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    }

    req.userId = decoded.id; // Save user ID from the token payload
    next(); // Proceed to the next middleware
  });
};

// Verify if the user has an "admin" role
const isAdmin = (req, res, next) => {
  User.findByPk(req.userId)
    .then((user) => {
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next(); // User is admin; proceed to the next middleware
            return;
          }
        }

        // If no admin role is found, send a forbidden response
        res.status(403).send({
          message: "Require Admin Role!",
        });
        return;
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

// Export the middleware functions
const authJwt = {
  verifyToken,
  isAdmin,
};

module.exports = authJwt;
