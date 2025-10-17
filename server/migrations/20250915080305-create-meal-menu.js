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
      meal_tray_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "Meal_Trays",
          key: "id",
        },
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descriptions: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      nutrition_facts: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      for_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("approved", "revisi", "pending", "resubmit"),
        allowNull: false,
        defaultValue: "pending",
      },
      status_notes: {
        type: Sequelize.STRING,
        allowNull: true,
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
