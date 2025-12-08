module.exports = (sequelize, Sequelize) => {
  const Inventory = sequelize.define("inventory", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'productId',
      references: {
        model: "products",
        key: "id",
      },
    },
    warehouseId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'warehouseId',
      defaultValue: 1,
    },
    quantity_available: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'quantity_available',
    },
  }, {
    tableName: 'inventories', // Explicitly set table name
    timestamps: true,
    underscored: false,
  });

  return Inventory;
};
