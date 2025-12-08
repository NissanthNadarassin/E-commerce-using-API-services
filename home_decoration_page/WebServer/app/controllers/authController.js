const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;


exports.register = (req, res) => {
  console.log("Request Body for Registration:", req.body); // Debug log
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8), // Hash the password
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: { name: req.body.roles },
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User registered successfully!" });
          });
        });
      } else {
        // Default to role "user" (id 1)
        user.setRoles([1]).then(() => {
          res.send({ message: "User registered successfully!" });
        });
      }
    })
    .catch((err) => {
      console.error("Error during registration:", err.message); // Debug log
      res.status(500).send({ message: err.message });
    });
};

exports.signin = async (req, res) => {
  try {
    console.log("Request Body for Login:", req.body); // Debug log

    // Find user by email or username
    const user = await User.findOne({ 
      where: { 
        email: req.body.email || req.body.username 
      } 
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Validate password
    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid password!",
      });
    }

    // Fetch roles
    const roles = await user.getRoles();
    const authorities = roles.map((role) => role.name); // Extract role names

    // Generate token with roles in the payload
    const token = jwt.sign(
      { id: user.id, roles: authorities }, // Include roles in the payload
      config.secret,
      { expiresIn: 86400 } // 24 hours
    );

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities, // All roles
      accessToken: token,
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).send({ message: err.message });
  }
};