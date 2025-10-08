"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    return queryInterface.bulkInsert("Departments", [
      {
        name: "General Affair",
        location_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: "Human Resource",
        location_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Purchasing",
        location_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Manufacturing Development",
        location_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete("departments", null, {});
  },
};
