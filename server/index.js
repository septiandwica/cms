const express = require("express");
const morgan = require("morgan");
const database_pool = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

database_pool
  .getConnection()
  .then((connection_db) => {
    console.log("Connected to the MySQL database");
    connection_db.release();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });
