module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    company_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  Company.associate = (models) => {
    Company.hasMany(models.Customer, {
      foreignKey: 'company_id',
      as: 'Customers',
    });
  };

  return Company;
}