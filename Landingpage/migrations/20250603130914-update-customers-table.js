'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the new companyName column, but allow it to be null initially
    await queryInterface.addColumn('Customers', 'companyName', {
      type: Sequelize.STRING(100),
      allowNull: true, // Temporarily allow NULLs
      references: {
        model: 'Companies',
        key: 'company_name',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Use SET NULL or CASCADE depending on your logic
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Customers', 'companyName');
  }
};