const dotenv = require('dotenv');
dotenv.config();
const db = require("./app/models");

async function fix() {
    try {
        await db.sequelize.authenticate();
        console.log("Connected.");

        const query = `
            ALTER TABLE orders 
            MODIFY COLUMN status 
            ENUM('pending', 'processing', 'preparing', 'en route', 'delivered', 'completed', 'cancelled', 'returned') 
            DEFAULT 'pending';
        `;

        await db.sequelize.query(query);
        console.log("Schema updated successfully.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

fix();
