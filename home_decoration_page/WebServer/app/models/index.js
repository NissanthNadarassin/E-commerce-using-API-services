const dbConfig = require("../config/db.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
  logging: false, 
});

sequelize.authenticate()
  .then(() => {
    console.log("Connection to the database has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.products = require("./productModel.js")(sequelize, Sequelize);
db.user = require("./userModel.js")(sequelize, Sequelize);
db.role = require("./roleModel.js")(sequelize, Sequelize);
db.order = require("./orderModel.js")(sequelize, Sequelize);
db.orderItem = require("./orderItemModel.js")(sequelize, Sequelize);
db.inventory = require("./inventoryModel.js")(sequelize, Sequelize);
db.review = require("./reviewModel.js")(sequelize, Sequelize);
db.userAddress = require("./userAddressModel.js")(sequelize, Sequelize);
db.warehouse = require("./warehouseModel.js")(sequelize, Sequelize);

module.exports = db;

// User-Role relationships
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});

db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId"
});

// Order-User relationship
db.user.hasMany(db.order, {
  foreignKey: "userId",
  as: "orders"
});

db.order.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user"
});

// Order-OrderItem relationship
db.order.hasMany(db.orderItem, {
  foreignKey: "orderId",
  as: "items"
});

db.orderItem.belongsTo(db.order, {
  foreignKey: "orderId",
  as: "order"
});

// OrderItem-Product relationship
db.products.hasMany(db.orderItem, {
  foreignKey: "productId",
  as: "orderItems"
});

db.orderItem.belongsTo(db.products, {
  foreignKey: "productId",
  as: "product"
});

// Inventory-Product relationship (one product can have inventory in multiple warehouses)
db.products.hasMany(db.inventory, {
  foreignKey: "productId",
  as: "inventory"
});

db.inventory.belongsTo(db.products, {
  foreignKey: "productId",
  as: "product"
});

// Warehouse-Inventory relationship
db.warehouse.hasMany(db.inventory, {
  foreignKey: "warehouseId",
  as: "inventory"
});

db.inventory.belongsTo(db.warehouse, {
  foreignKey: "warehouseId",
  as: "warehouse"
});

// Review-User relationship
db.user.hasMany(db.review, {
  foreignKey: "userId",
  as: "reviews"
});

db.review.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user"
});

// Review-Product relationship
db.products.hasMany(db.review, {
  foreignKey: "productId",
  as: "reviews"
});

db.review.belongsTo(db.products, {
  foreignKey: "productId",
  as: "product"
});

// User-UserAddress relationship
db.user.hasMany(db.userAddress, {
  foreignKey: "userId",
  as: "addresses"
});

db.userAddress.belongsTo(db.user, {
  foreignKey: "userId",
  as: "user"
});

db.ROLES = ["user", "admin"]