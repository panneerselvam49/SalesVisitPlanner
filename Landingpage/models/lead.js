module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // This field holds the company name for the lead
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Location remains a string field as per your request
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // This field now holds the name of the contact person for the lead
    person_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contact_details: {
      type: DataTypes.TEXT,
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
    // A lead can have many visits
    Lead.hasMany(models.Visit, {
        foreignKey: 'lead_id',
        as: 'Visits'
    });
  };

  return Lead;
};
