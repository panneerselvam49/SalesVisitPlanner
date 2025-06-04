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
    companyName: { 
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'Companies', 
        key: 'company_name', 
      }
    },
  }, {
    tableName: 'Customers',
    timestamps: true,
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.Company, {
      foreignKey: 'companyName', 
      targetKey: 'company_name', 
      as: 'Company'        
    });
  };

  return Customer;
};