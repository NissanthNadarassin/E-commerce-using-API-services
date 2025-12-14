module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define("orders", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'userId',
      references: {
        model: "users",
        key: "id",
      },
    },
    total_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
    },
    status: {
      type: Sequelize.ENUM("pending", "processing", "preparing", "en route", "delivered", "completed", "cancelled", "returned"),
      defaultValue: "pending",
      field: 'status',
    },
    shippingAddressId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'shippingAddressId',
    },
    billingAddressId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: 'billingAddressId',
    },
  }, {
    timestamps: true,
    underscored: false,
  });

  return Order;
};
