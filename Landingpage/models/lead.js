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
<<<<<<< HEAD
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
=======
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
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
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
<<<<<<< HEAD
    // A Lead belongs to one CustomerMaster. This is the crucial missing link.
    Lead.belongsTo(models.CustomerMaster, {
        foreignKey: 'customerMasterId',
        as: 'CustomerMaster'
    });
=======
    // A lead can have many visits
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    Lead.hasMany(models.Visit, {
        foreignKey: 'lead_id',
        as: 'Visits'
    });
  };

  return Lead;
};
