'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Order_Details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
     order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Orders', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      day: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      shift_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
         references: {
          model: 'Shifts', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      meal_menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
         references: {
          model: 'Meal_Menus', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Order_Details');
  }
};