'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn('Customers', 'customer_id', {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      }, { transaction });

      // Corrected line for the 'name' column
      await queryInterface.changeColumn('Customers', 'name', { // Added 'name' as the column to change
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      await queryInterface.changeColumn('Customers', 'contact', {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      await queryInterface.changeColumn('Customers', 'department', {
        type: Sequelize.STRING,
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('Customers', 'companyName', {
        type: Sequelize.STRING(100),
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'company_name',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }, { transaction });

      const tableDescription = await queryInterface.describeTable('Customers');
      if (!tableDescription.createdAt) {
        await queryInterface.addColumn('Customers', 'createdAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }, { transaction });
      }
      if (!tableDescription.updatedAt) {
        await queryInterface.addColumn('Customers', 'updatedAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Migration for Customers table failed:", err);
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Customers', 'companyName', { transaction });
      // Consider the order of removal if there are dependencies, though for these it's likely fine.
      await queryInterface.removeColumn('Customers', 'updatedAt', { transaction });
      await queryInterface.removeColumn('Customers', 'createdAt', { transaction });
      
      // You would also add logic here to revert the changes made by changeColumn
      // e.g., change 'name' back to its previous state if it was different.
      // For simplicity, often 'down' migrations for 'changeColumn' might just leave it
      // or revert allowNull properties if that was the main change.
      // Example:
      // await queryInterface.changeColumn('Customers', 'name', {
      //   type: Sequelize.STRING,
      //   allowNull: true, // Assuming it might have been true before
      // }, { transaction });


      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Rollback of Customers migration failed:", err);
      throw err;
    }
  }
};