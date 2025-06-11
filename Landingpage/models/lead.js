module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
    lead_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
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
        type: DataTypes.ENUM('Active', 'Not Active', 'Converted', 'Scheduled'),
        allowNull: false,
        defaultValue: 'Active' 
    },
  }, {
    tableName: 'Leads',
    timestamps: true,
  });

  Lead.associate = (models) => {
    Lead.hasMany(models.LeadContact, {
      foreignKey: 'lead_id',
      as: 'LeadContacts'
    });
    Lead.hasMany(models.Visit, {
        foreignKey: 'lead_id',
        as: 'Visits'
    });
  };

  return Lead;
};
