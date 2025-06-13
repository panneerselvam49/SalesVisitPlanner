'use strict';
/**
 * This migration adds the 'customerMasterId' foreign key to the 'Leads' table.
 * This is the missing step to link leads to the new master customer table.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Leads', // The name of the table to alter
      'customerMasterId', // The name of the new column
      {
        type: Sequelize.INTEGER,
        allowNull: true, // Set to true initially to avoid errors on existing rows
        references: {
          model: 'CustomerMasters', // The master table it links to
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Leads', 'customerMasterId');
  }
};
