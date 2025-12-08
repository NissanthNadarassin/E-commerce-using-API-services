module.exports = (sequelize, Sequelize) => {
  const Review = sequelize.define("reviews", {
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
    productId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: 'productId',
      references: {
        model: "products",
        key: "id",
      },
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  return Review;
};
