'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Customers', 'department');
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('Customers', 'department', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  }
};