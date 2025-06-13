/**
 * Defines the Customer model, repurposed to store CONTACT PERSON details.
 */
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
<<<<<<< HEAD
    // This new field links this contact person to the master customer record.
    customerMasterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CustomerMasters',
        key: 'id',
      }
    },
=======
    // This field now holds the company name
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // This is the foreign key to the new Location table
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Locations', // Correctly references the table name
        key: 'id',
      }
    },
    // This field now holds the name of the contact person
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    person_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'The name of the specific contact person.'
    },
    contact_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Contact info for this specific person.'
    },
<<<<<<< HEAD
    // The 'name' field for the company name is correctly removed from this model.
=======
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
  }, {
    tableName: 'Customers',
    timestamps: true,
  });

  Customer.associate = (models) => {
<<<<<<< HEAD
    // A Customer (contact) belongs to one CustomerMaster.
    Customer.belongsTo(models.CustomerMaster, {
      foreignKey: 'customerMasterId',
      as: 'CustomerMaster'
    });
=======
    // A customer belongs to one Location
    Customer.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location'
    });
    // A customer can have many visits
>>>>>>> eb9766edb7d950e1c29a7a5e203ec2e8e8087d88
    Customer.hasMany(models.Visit, {
      foreignKey: 'customer_id',
      as: 'Visits'
    });
  };

  return Customer;
};
