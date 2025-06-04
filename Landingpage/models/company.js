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

  return Company;
};