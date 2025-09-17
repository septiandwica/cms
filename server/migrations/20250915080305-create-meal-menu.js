"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Meal_Menus", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      vendor_catering_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Vendor_Caterings",
          key: "id",
        },
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
      },
      nutrition_facts: {
        type: Sequelize.TEXT,
      },
      for_date: {
        type: Sequelize.DATEONLY,
      },
      status: {
        type: Sequelize.ENUM("approved", "rejected", "pending"),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Meal_Menus");
  },
};
