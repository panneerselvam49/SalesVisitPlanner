module.exports = (sequelize, DataTypes) => {
  const CustomerMaster = sequelize.define('CustomerMaster', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'The unique ID for the master customer record.'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'The official and unique name of the customer company.'
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'A reference to the primary location of the customer.',
      references: {
        model: 'Locations',
        key: 'id',
      }
    }
  }, {
    tableName: 'CustomerMasters',
    timestamps: true,
  });

  CustomerMaster.associate = (models) => {
    CustomerMaster.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'Location'
    });
    CustomerMaster.hasMany(models.Customer, {
      foreignKey: 'customerMasterId',
      as: 'Contacts'
    });
  };

  return CustomerMaster;
};
