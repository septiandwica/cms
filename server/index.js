require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const passport = require("passport");

const { sequelize } = require("./config/db");
require("./config/passport")(passport);

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";
const CLIENT_URL = process.env.CLIENT_URL;

const app = express();
app.set("trust proxy", 1);

// Security headers
app.use(helmet());
if (IS_PROD) {
  app.use(
    helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    })
  );
}

// CORS
app.use(
  cors({
    origin(origin, cb) {
      const whitelist = [
        CLIENT_URL,
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",

        "http://127.0.0.1:5173",
      ].filter(Boolean);
      if (!origin || whitelist.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

// Common middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Passport
app.use(passport.initialize());


app.use("/auth", require("./routes/authRouter.js"));

app.use("/users", require("./routes/userRouter.js"));
app.use("/roles", require("./routes/roleRouter.js"));
app.use("/locations", require("./routes/locationRouter.js"));
app.use("/departments", require("./routes/departmentRouter.js"));
app.use("/meal-trays", require("./routes/mealTrayRouter.js"));
app.use("/shifts", require("./routes/shiftRouter.js"));
app.use("/vendor-caterings", require("./routes/vendorCateringRouter.js"));
app.use("/meal-menus", require("./routes/mealMenuRouter.js"));
app.use("/qr-codes", require("./routes/qrCodeRouter.js"));
app.use("/orders", require("./routes/orderRouter.js"));
app.use("/order-details", require("./routes/orderDetailsRouter.js"));

// Routes
app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.get('/docs', (req, res) => {
  // QR Code data base64 dari response API atau database
  const qrCodeBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKdSURBVO3BQY7YSAwEwSxC//9yro88NSBIGo+5jIh/sMYo1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlGKNUqxRijXKxUNJ+EkqdyThROUkCT9J5YlijVKsUYo1ysXLVN6UhCdUuiR0SehUTlTelIQ3FWuUYo1SrFEuPpaEO1TuSEKncqLSJeGJJNyh8qVijVKsUYo1ysUwSehUTlQmKdYoxRqlWKNcDKPSJeEOlX9ZsUYp1ijFGuXiYyq/iUqXhCdUfpNijVKsUYo1ysXLkjBZEn6zYo1SrFGKNcrFQyq/SRI6lS4Jd6j8S4o1SrFGKdYoFw8loVPpkvAmlU7lDpUuCSdJeJPKl4o1SrFGKdYoFy9LwolKl4RO5YkknKicJOEOlZMkdEk4UXmiWKMUa5RijXLxkModSehUuiScqDyRhE7lJAmdykkSOpUuCZ3Km4o1SrFGKdYoFx9Lwh0qJ0k4UflSEu5Iwk8q1ijFGqVYo1z8ZUnoVLokdCpdEu5IQqfSJeFE5YkkfKlYoxRrlGKNEv/gH5aEE5UuCScqXRK+pPKmYo1SrFGKNcrFQ0n4SSqdSpeEE5UuCV0SOpU7kvA3FWuUYo1SrFEuXqbypiScJKFTOUnCE0l4QuVLxRqlWKMUa5SLjyXhDpUvqXRJuEPlJAmdSpeETuVNxRqlWKMUa5SL4ZLQqZyodEnoVLokdCpdEjqVLxVrlGKNUqxRLv5nktCpnKh0SehUTlR+UrFGKdYoxRrl4mMqX1LpknCi8pOS0Kl8qVijFGuUYo1y8bIk/KQkdCpdErokdCpfUumS0Km8qVijFGuUYo0S/2CNUaxRijVKsUYp1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlP8AQnPw+d26P5wAAAAASUVORK5CYII=";  // Contoh base64 string QR Code

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QR Code Display</title>
    </head>
    <body>
      <h1>Here is Your QR Code</h1>
      <img src="${qrCodeBase64}" alt="QR Code" />
    </body>
    </html>
  `);
});
// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ success: false, message: "Invalid CSRF token" });
  }
  return next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err?.message || "Internal server error",
  });
});

// Start server setelah DB connect
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  });
