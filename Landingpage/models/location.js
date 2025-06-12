module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'Locations',
  });

  Location.associate = (models) => {
    // A location can be associated with multiple customers
    Location.hasMany(models.Customer, {
      foreignKey: 'locationId',
      as: 'Customers',
    });
  };

  return Location;
};
