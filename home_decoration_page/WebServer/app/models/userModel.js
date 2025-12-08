module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Default: user is not blocked
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // Define associations
  User.associate = (models) => {
    // Many-to-Many relationship with Role
    User.belongsToMany(models.Role, {
      through: "user_roles", // Join table name
      foreignKey: "userId",  // Key in user_roles for User
      otherKey: "roleId",    // Key in user_roles for Role
    });
  };

  // Define the fetchRoles function to avoid recursion
  User.prototype.fetchRoles = async function () {
    // Use Sequelize's auto-generated method getRoles to fetch associated roles
    const roles = await this.getRoles();
    return roles.map((role) => role.name); // Return an array of role names
  };

  return User;
};