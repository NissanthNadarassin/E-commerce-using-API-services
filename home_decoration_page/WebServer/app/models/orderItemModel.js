module.exports = (sequelize, Sequelize) => {
  const OrderItem = sequelize.define("order_items", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },
    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
  });

  return OrderItem;
};
