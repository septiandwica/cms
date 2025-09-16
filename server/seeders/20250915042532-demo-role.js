'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   return queryInterface.bulkInsert('Roles', [
      {
        name: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'general_affair',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'admin_department',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'employee',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'vendor_catering',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('roles', null, {});
  }
};
