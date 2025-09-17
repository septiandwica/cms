'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vendor_Caterings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
         type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING
      },
      location_id: {
        type: Sequelize.INTEGER,
        references:{
          model: "Locations",
          key: "id",
        },
        allowNull:false,
      },
      shift_id: {
        type: Sequelize.INTEGER,
        references:{
          model: "Shifts",
          key: "id",
        },
        allowNull:false,
      },
      address:{
         type: Sequelize.STRING,
      },
      status:{
        type: Sequelize.ENUM("active", "inactive"),
        allowNull: false,
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
    await queryInterface.dropTable('Vendor_Caterings');
  }
};