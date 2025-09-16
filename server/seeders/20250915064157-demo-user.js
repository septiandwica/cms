"use strict";

const bcrypt = require("bcrypt");
const saltRounds = 10;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash("password123", saltRounds);
    return queryInterface.bulkInsert("Users", [
      {
        nik: "ADMIN1",
        name: "admin septian",
        email: "septiandwica03@gmail.com",
        password: passwordHash,
        phone: "0812345678",
        role_id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
   return queryInterface.bulkDelete('users', null, {});
  },
};
