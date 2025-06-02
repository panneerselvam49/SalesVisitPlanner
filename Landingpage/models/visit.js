module.exports = (sequelize, DataTypes) => {
  const Visit = sequelize.define('Visit', {
    visit_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employee_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  status: {
  type: DataTypes.ENUM('Planned', 'Completed', 'Cancelled', 'Pending', 'In-Progress'),
  allowNull: false,
  defaultValue: 'Planned', // Default to 'Planned' when a new visit is created
  },
  }, {
    timestamps: false,
  });

  Visit.associate = (models) => {
    Visit.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'Employee',
    });
    Visit.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'Customer',
    });
  };

  return Visit;
};
