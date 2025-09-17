require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const passport = require("passport");
const { csrfProtection, requireCsrfOnUnsafeMethods } = require("./middleware/csrfMiddleware.js");
const { issueCsrfToken } = require("./controller/securityController.js");

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

// ===== CSRF INTEGRATION =====


// Endpoint untuk mengeluarkan token CSRF (FE panggil ini sebelum melakukan POST/PUT/PATCH/DELETE)
app.get("/csrf-token", csrfProtection, issueCsrfToken);


// --- Rute yang tidak perlu CSRF protection ---
app.use("/auth", require("./routes/authRouter.js"));

app.use(requireCsrfOnUnsafeMethods);

// Routes
app.get("/", (_req, res) => {
  res.send("Hello World!");
});

app.use("/users", require("./routes/userRouter.js"));
app.use("/roles", require("./routes/roleRouter.js"));
app.use("/locations", require("./routes/locationRouter.js"));
app.use("/departments", require("./routes/departmentRouter.js"));
app.use("/shifts", require("./routes/shiftRouter.js"));
app.use("/meal-menus", require("./routes/mealMenuRouter.js"));

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
