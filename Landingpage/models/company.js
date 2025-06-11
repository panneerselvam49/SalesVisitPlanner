module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    company_name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    location:{
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
  });
  Company.associate = (models) => {
    Company.hasMany(models.Customer, {
      foreignKey: 'companyName',
      sourceKey: 'company_name',
      as: 'Customers'
    });
  };
  return Company;
};