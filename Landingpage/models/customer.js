module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'Company',
    });

    Customer.hasMany(models.Visit, {
      foreignKey: 'customer_id',
      as: 'Visits',
    });
  };

  return Customer;
};