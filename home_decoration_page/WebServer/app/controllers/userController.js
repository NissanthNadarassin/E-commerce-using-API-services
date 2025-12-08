const db = require("../models");
const User = db.user;
const Role = db.role;

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "blocked"], // Adjust fields as needed
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] }, // Exclude join table data
        },
      ],
    });
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).send({ message: "Error fetching users." });
  }
};

// Get a specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ["id", "username", "email", "blocked"],
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] }, // Exclude join table data
        },
      ],
    });
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).send({ message: "Error fetching user." });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const result = await User.destroy({
      where: { id: req.params.id },
    });
    if (result === 0) {
      return res.status(404).send({ message: "User not found." });
    }
    res.status(200).send({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).send({ message: "Error deleting user." });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    user.blocked = true;
    await user.save();
    res.status(200).send({ message: `User ${user.username} has been blocked.` });
  } catch (err) {
    console.error("Error blocking user:", err.message);
    res.status(500).send({ message: "Error blocking user." });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    user.blocked = false;
    await user.save();
    res.status(200).send({ message: `User ${user.username} has been unblocked.` });
  } catch (err) {
    console.error("Error unblocking user:", err.message);
    res.status(500).send({ message: "Error unblocking user." });
  }
};

// Get roles for a specific user
exports.getRoles = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          attributes: ["id", "name"], // Return role ID and name
          through: { attributes: [] }, // Exclude join table data
        },
      ],
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const roles = user.roles.map((role) => role.name); // Extract role names
    res.status(200).json({ roles });
  } catch (err) {
    console.error("Error fetching roles for user:", err.message);
    res.status(500).send({ message: "Error fetching user roles." });
  }
};

// Find all users (alternative function, if needed)
exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "blocked"], // Adjust fields as needed
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] }, // Exclude join table data
        },
      ],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error retrieving users:", error.message);
    res.status(500).send({ message: "Error retrieving users." });
  }
};

// Update own profile (User can update their own information)
exports.updateOwnProfile = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    const { username, email, password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      const bcrypt = require("bcryptjs");
      user.password = bcrypt.hashSync(password, 8);
    }

    await user.save();
    res.status(200).send({ 
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Error updating profile:", err.message);
    res.status(500).send({ message: "Error updating profile." });
  }
};

// Delete own account (User can delete their own account)
exports.deleteOwnAccount = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token

    const result = await User.destroy({
      where: { id: userId },
    });

    if (result === 0) {
      return res.status(404).send({ message: "User not found." });
    }

    res.status(200).send({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Error deleting account:", err.message);
    res.status(500).send({ message: "Error deleting account." });
  }
};

// Get user's addresses
exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token

    const addresses = await db.userAddress.findAll({
      where: { userId },
      order: [['is_default_shipping', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).send(addresses);
  } catch (err) {
    console.error("Error fetching addresses:", err.message);
    res.status(500).send({ message: "Error fetching addresses." });
  }
};

// Add new address for user
exports.addUserAddress = async (req, res) => {
  try {
    const userId = req.userId; // From JWT token
    const { label, address_line1, address_line2, city, postal_code, country, phone, is_default_shipping, is_default_billing } = req.body;

    // Validate required fields
    if (!address_line1 || !city || !postal_code || !country) {
      return res.status(400).send({ message: "Address line 1, city, postal code, and country are required." });
    }

    // If setting as default, unset other defaults first
    if (is_default_shipping) {
      await db.userAddress.update(
        { is_default_shipping: false },
        { where: { userId, is_default_shipping: true } }
      );
    }

    if (is_default_billing) {
      await db.userAddress.update(
        { is_default_billing: false },
        { where: { userId, is_default_billing: true } }
      );
    }

    // Create new address
    const newAddress = await db.userAddress.create({
      userId,
      label,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone,
      is_default_shipping: is_default_shipping || false,
      is_default_billing: is_default_billing || false,
    });

    res.status(201).send({
      message: "Address added successfully!",
      address: newAddress
    });
  } catch (err) {
    console.error("Error adding address:", err.message);
    res.status(500).send({ message: "Error adding address." });
  }
};

// Update user's address
exports.updateUserAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.id;
    const { label, address_line1, address_line2, city, postal_code, country, phone, is_default_shipping, is_default_billing } = req.body;

    // Find address and verify ownership
    const address = await db.userAddress.findOne({
      where: { id: addressId, userId }
    });

    if (!address) {
      return res.status(404).send({ message: "Address not found or you don't have permission to edit it." });
    }

    // Validate required fields
    if (!address_line1 || !city || !postal_code || !country) {
      return res.status(400).send({ message: "Address line 1, city, postal code, and country are required." });
    }

    // If setting as default, unset other defaults first
    if (is_default_shipping && !address.is_default_shipping) {
      await db.userAddress.update(
        { is_default_shipping: false },
        { where: { userId, is_default_shipping: true } }
      );
    }

    if (is_default_billing && !address.is_default_billing) {
      await db.userAddress.update(
        { is_default_billing: false },
        { where: { userId, is_default_billing: true } }
      );
    }

    // Update address
    await address.update({
      label,
      address_line1,
      address_line2,
      city,
      postal_code,
      country,
      phone,
      is_default_shipping: is_default_shipping || false,
      is_default_billing: is_default_billing || false,
    });

    res.status(200).send({
      message: "Address updated successfully!",
      address
    });
  } catch (err) {
    console.error("Error updating address:", err.message);
    res.status(500).send({ message: "Error updating address." });
  }
};

// Delete user's address
exports.deleteUserAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const addressId = req.params.id;

    // Find address and verify ownership
    const address = await db.userAddress.findOne({
      where: { id: addressId, userId }
    });

    if (!address) {
      return res.status(404).send({ message: "Address not found or you don't have permission to delete it." });
    }

    await address.destroy();

    res.status(200).send({
      message: "Address deleted successfully!"
    });
  } catch (err) {
    console.error("Error deleting address:", err.message);
    res.status(500).send({ message: "Error deleting address." });
  }
};

