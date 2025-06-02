'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('Customers', 'Customers_company_id_fkey', { transaction }); 
      await queryInterface.removeConstraint('Companies', 'Companies_pkey', { transaction });
      await queryInterface.changeColumn('Customers', 'company_id', {
        type: Sequelize.STRING(100),
        allowNull: false, 
      }, { transaction });
      await queryInterface.changeColumn('Companies', 'company_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
        primaryKey: false,
      }, { transaction });
      await queryInterface.addConstraint('Companies', {
        fields: ['company_id'],
        type: 'primary key',
        name: 'Companies_pkey', 
        transaction,
      });
      await queryInterface.addConstraint('Customers', {
        fields: ['company_id'],
        type: 'foreign key',
        name: 'Customers_company_id_fkey',
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
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('Customers', 'Customers_company_id_fkey', { transaction });
      await queryInterface.removeConstraint('Companies', 'Companies_pkey', { transaction });
      await queryInterface.changeColumn('Customers', 'company_id', {
        type: Sequelize.INTEGER,
      }, { transaction });
      await queryInterface.changeColumn('Companies', 'company_id', {
        type: Sequelize.INTEGER,
        primaryKey: false,
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};