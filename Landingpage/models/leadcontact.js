module.exports = (sequelize, DataTypes) => {
  const LeadContact = sequelize.define('LeadContact', {
    lead_contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Leads',
        key: 'lead_id',
      }
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'LeadContacts',
    timestamps: true,
  });

  LeadContact.associate = (models) => {
    LeadContact.belongsTo(models.Lead, {
      foreignKey: 'lead_id',
      as: 'Lead'
    });
  };

  return LeadContact;
};
