'use strict';

module.exports = {
  // This 'up' method is responsible for DELETING company_id and its constraints
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove foreign key from Customers that references Companies.company_id
      await queryInterface.removeConstraint('Customers', 'Customers_company_id_fkey', { transaction }); //

      // Remove company_id column from Customers
      await queryInterface.removeColumn('Customers', 'company_id', { transaction });

      // Remove primary key constraint from Companies (which was on company_id)
      await queryInterface.removeConstraint('Companies', 'Companies_pkey', { transaction }); //

      // Remove company_id column from Companies
      await queryInterface.removeColumn('Companies', 'company_id', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Migration to remove company_id failed:", err);
      throw err;
    }
  },

  // This 'down' method is responsible for REVERSING the deletions made by THIS 'up' method.
  // It restores company_id to how it was after the '20250602052152-change-company-id-to-string.js' migration.
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add company_id column back to Companies
      await queryInterface.addColumn('Companies', 'company_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
      }, { transaction });

      // Add primary key constraint back to Companies.company_id
      await queryInterface.addConstraint('Companies', {
        fields: ['company_id'],
        type: 'primary key',
        name: 'Companies_pkey', //
        transaction,
      });

      // Add company_id column back to Customers
      await queryInterface.addColumn('Customers', 'company_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
      }, { transaction });

      // Add foreign key constraint back to Customers.company_id
      await queryInterface.addConstraint('Customers', {
        fields: ['company_id'],
        type: 'foreign key',
        name: 'Customers_company_id_fkey', //
        references: {
          table: 'Companies',
          field: 'company_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Rollback of company_id removal failed:", err);
      throw err;
    }
  }
};