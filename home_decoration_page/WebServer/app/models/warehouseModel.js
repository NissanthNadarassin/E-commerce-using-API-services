module.exports = (sequelize, Sequelize) => {
  const Warehouse = sequelize.define("warehouse", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    address_line1: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    address_line2: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    city: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    postal_code: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    country: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING(30),
      allowNull: true,
    },
  }, {
    tableName: 'warehouses',
    timestamps: true,
  });

  return Warehouse;
};
