module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
    company_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
    status:{
        type: DataTypes.ENUM('Active', 'Not Acitve', 'Converted'),
        allowNull: false,
    },
  }, {
    tableName: 'Leads',
    timestamps: true,
  });

  return Lead;
};