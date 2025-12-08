module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define("user_addresses", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    is_default_shipping: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_default_billing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'user_addresses',
    timestamps: true,
  });

  return UserAddress;
};
