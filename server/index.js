require('dotenv').config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");                
const cookieParser = require("cookie-parser"); 
const passport = require("passport"); 
const sequelize = require("./config/db").sequelize;  

require("./config/passport")(passport);

const PORT = process.env.PORT || 3000;

// Init
const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());


app.use(passport.initialize());
app.use("/auth", require("./routes/authRouter.js"));
app.use("/users", require("./routes/userRouter.js"));
app.use("/roles", require("./routes/roleRouter.js"));
app.use("/locations", require("./routes/locationRouter.js"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message,
  });
});


sequelize
  .authenticate()
  .then(() => {
    // server akan di start setelah koneksi database berhasil
    console.log("Database connection has been established successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  // Jika koneksi gagal, log error dan tidak start server
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);  
  });



