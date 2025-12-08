const bcrypt = require("bcryptjs");
const db = require("./app/models"); ;
const Role = db.role;
const User = db.user;

async function seedAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: "admin@example1.com" },
    });

    if (existingAdmin) {
      console.log("Admin already exists. Skipping creation.");
      return;
    }

    // Create admin user
    const admin = await User.create({
      username: "testadmin",
      email: "admin@example1.com",
      password: bcrypt.hashSync("admin123", 8), // Hash the password
    });

    // Find admin role
    const adminRole = await Role.findOne({ where: { name: "admin" } });

    if (!adminRole) {
      console.log("Admin role does not exist. Please create roles first.");
      return;
    }

    // Assign admin role to the user
    await admin.setRoles([adminRole]);
    console.log("Admin user created successfully!");
  } catch (err) {
    console.error("Error seeding admin:", err.message);
  }
}

module.exports = seedAdmin;
