const db = require("./app/models");
const User = db.user;
const Role = db.role;
const bcrypt = require("bcryptjs");

const users = [
  { username: "john_doe", email: "john.doe@example.com", password: "user123", phone: "+33612345678" },
  { username: "jane_smith", email: "jane.smith@example.com", password: "user123", phone: "+33612345679" },
  { username: "mike_wilson", email: "mike.wilson@example.com", password: "user123", phone: "+33612345680" },
  { username: "sarah_brown", email: "sarah.brown@example.com", password: "user123", phone: "+33612345681" },
  { username: "david_jones", email: "david.jones@example.com", password: "user123", phone: "+33612345682" },
  { username: "emma_davis", email: "emma.davis@example.com", password: "user123", phone: "+33612345683" },
  { username: "alex_miller", email: "alex.miller@example.com", password: "user123", phone: "+33612345684" },
  { username: "lisa_garcia", email: "lisa.garcia@example.com", password: "user123", phone: "+33612345685" },
  { username: "chris_rodriguez", email: "chris.rodriguez@example.com", password: "user123", phone: "+33612345686" },
  { username: "marie_martin", email: "marie.martin@example.com", password: "user123", phone: "+33612345687" },
  { username: "thomas_blanc", email: "thomas.blanc@example.com", password: "user123", phone: "+33612345688" },
  { username: "sophie_laurent", email: "sophie.laurent@example.com", password: "user123", phone: "+33612345689" },
  { username: "pierre_dubois", email: "pierre.dubois@example.com", password: "user123", phone: "+33612345690" },
  { username: "claire_moreau", email: "claire.moreau@example.com", password: "user123", phone: "+33612345691" },
  { username: "lucas_bernard", email: "lucas.bernard@example.com", password: "user123", phone: "+33612345692" },
  { username: "julie_petit", email: "julie.petit@example.com", password: "user123", phone: "+33612345693" },
  { username: "nicolas_roux", email: "nicolas.roux@example.com", password: "user123", phone: "+33612345694" },
  { username: "camille_simon", email: "camille.simon@example.com", password: "user123", phone: "+33612345695" },
  { username: "maxime_andre", email: "maxime.andre@example.com", password: "user123", phone: "+33612345696" },
  { username: "lea_fontaine", email: "lea.fontaine@example.com", password: "user123", phone: "+33612345697" }
];

async function seedUsers() {
  try {
    console.log("Starting user seeding...");

    // Get user role
    const userRole = await Role.findOne({ where: { name: "user" } });
    if (!userRole) {
      console.error("User role not found! Please run role seeding first.");
      process.exit(1);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists. Skipping...`);
        skippedCount++;
        continue;
      }

      // Create new user
      const hashedPassword = bcrypt.hashSync(userData.password, 8);
      const newUser = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone
      });

      // Assign user role
      await newUser.setRoles([userRole.id]);
      
      console.log(`✓ Created user: ${userData.username} (${userData.email})`);
      createdCount++;
    }

    console.log("\n=== User Seeding Summary ===");
    console.log(`Created: ${createdCount} users`);
    console.log(`Skipped: ${skippedCount} users (already exist)`);
    console.log(`Total: ${users.length} users processed`);
    console.log("User seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

// Initialize database and run seeding
db.sequelize.sync().then(() => {
  seedUsers();
});
