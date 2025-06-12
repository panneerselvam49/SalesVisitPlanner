module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
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
    person_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contact_details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'Customers',
    timestamps: true,
  });

  Customer.associate = (models) => {
    // A customer belongs to one Location
    Customer.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location'
    });
    // A customer can have many visits
    Customer.hasMany(models.Visit, {
      foreignKey: 'customer_id',
      as: 'Visits'
    });
  };

  return Customer;
};
