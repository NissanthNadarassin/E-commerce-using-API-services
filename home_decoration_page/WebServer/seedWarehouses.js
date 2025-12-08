const db = require("./app/models");

const warehouses = [
  {
    name: "Warehouse Paris",
    address_line1: "12 Rue Lafayette",
    address_line2: null,
    city: "Paris",
    postal_code: "75009",
    country: "France",
    phone: "+33 1 42 46 00 00"
  },
  {
    name: "Warehouse Lyon",
    address_line1: "5 Avenue Jean Jaurès",
    address_line2: null,
    city: "Lyon",
    postal_code: "69007",
    country: "France",
    phone: "+33 4 72 71 00 00"
  },
  {
    name: "Warehouse Marseille",
    address_line1: "22 Boulevard Rabatau",
    address_line2: null,
    city: "Marseille",
    postal_code: "13008",
    country: "France",
    phone: "+33 4 91 25 00 00"
  },
  {
    name: "Warehouse Lille",
    address_line1: "48 Rue Nationale",
    address_line2: null,
    city: "Lille",
    postal_code: "59000",
    country: "France",
    phone: "+33 3 20 06 00 00"
  },
  {
    name: "Warehouse Bordeaux",
    address_line1: "15 Cours Victor Hugo",
    address_line2: null,
    city: "Bordeaux",
    postal_code: "33000",
    country: "France",
    phone: "+33 5 56 01 00 00"
  },
  {
    name: "Warehouse Nice",
    address_line1: "29 Avenue Jean Médecin",
    address_line2: null,
    city: "Nice",
    postal_code: "06000",
    country: "France",
    phone: "+33 4 93 01 00 00"
  },
  {
    name: "Warehouse Toulouse",
    address_line1: "7 Place du Capitole",
    address_line2: null,
    city: "Toulouse",
    postal_code: "31000",
    country: "France",
    phone: "+33 5 61 11 00 00"
  }
];

const seedWarehouses = async () => {
  try {
    // Ensure database connection
    // await db.sequelize.authenticate(); // Connection is already handled in server.js
    // console.log("Connection to the database has been established successfully.");

    // Clear existing warehouses
    await db.warehouse.destroy({ where: {} });
    console.log("Existing warehouses cleared from the database.");

    // Seed warehouses
    await db.warehouse.bulkCreate(warehouses);
    console.log(`${warehouses.length} warehouses have been added to the database!`);

  } catch (error) {
    console.error("Error seeding warehouses:", error);
  }
};

module.exports = seedWarehouses;
