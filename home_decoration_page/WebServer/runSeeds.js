const seedProducts = require('./seedProducts');
const seedWarehouses = require('./seedWarehouses');
const seedInventory = require('./seedInventory');
const seedUsers = require('./seedUsers'); // Just in case
const seedOrders = require('./seedOrders'); // Optional
const db = require('./app/models');

const runSeeds = async () => {
    try {
        console.log("Syncing database...");
        await db.sequelize.sync(); // Ensure tables exist

        console.log("Running seedProducts...");
        await seedProducts();

        console.log("Running seedWarehouses...");
        await seedWarehouses();

        console.log("Running seedInventory...");
        await seedInventory();

        console.log("Running seedUsers...");
        await seedUsers();

        console.log("All seeds completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

runSeeds();
