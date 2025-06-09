'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Customers', 'contact', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert back to the old column definition if needed
    await queryInterface.changeColumn('Customers', 'contact', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  }
};