/**
 * Defines the Lead model, now correctly associated with CustomerMaster.
 */
module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // This new foreign key links the lead to a master customer record.
    customerMasterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CustomerMasters',
        key: 'id',
      }
    },
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
    // The 'name' and 'location' fields are correctly removed.
  }, {
    tableName: 'Leads',
    timestamps: true,
  });

  Lead.associate = (models) => {
    // A Lead belongs to one CustomerMaster. This is the crucial missing link.
    Lead.belongsTo(models.CustomerMaster, {
        foreignKey: 'customerMasterId',
        as: 'CustomerMaster'
    });
    Lead.hasMany(models.Visit, {
        foreignKey: 'lead_id',
        as: 'Visits'
    });
  };

  return Lead;
};
