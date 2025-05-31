module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    employee_id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Manager', 'Employee'),
      allowNull: false,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'Users',
    timestamps: false,
  });

  User.associate = (models) => {
    User.hasMany(models.User, {
      foreignKey: 'manager_id',
      as: 'Team',
    });
    User.belongsTo(models.User, {
      foreignKey: 'manager_id',
      as: 'Manager',
    });
  };

  return User;
};