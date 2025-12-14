const db = require("./app/models");

module.exports = {
    sequelize: db.sequelize,
    Sequelize: db.Sequelize,
    Product: db.products,
    User: db.user,
    Role: db.role,
    Order: db.order,
    OrderItem: db.orderItem,
    Inventory: db.inventory,
    Review: db.review,
    Address: db.userAddress,
    Warehouse: db.warehouse,
};
