const { Sequelize } = require('@sequelize/core');
const { MySqlDialect } = require('@sequelize/mysql');
require('dotenv').config();

// Menggunakan environment variables untuk konfigurasi
const sequelize = new Sequelize({
  dialect: MySqlDialect,
  database: process.env.DB_NAME || 'cms_db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
});

async function checkDatabaseConnection() {
  try {
    // Cek koneksi ke database
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
}

module.exports = { sequelize, checkDatabaseConnection };
