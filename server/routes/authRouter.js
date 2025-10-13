const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
} = require("../controller/authController");

const { isLoggedIn } = require("../middleware/authMiddleware");
const {
  authLimiter,
  registerLimiter,
  loginLimiter,
} = require("../middleware/AuthLimiterMiddleware");

const router = express.Router();

// Global rate limiter
router.use(authLimiter);

// 🧩 Register
router.post("/register", registerLimiter, registerUser);

// 🔐 Login
router.post("/login", loginLimiter, loginUser);

// 🚪 Logout
router.post("/logout", logoutUser);

// 🔑 Change Password (Protected)
router.patch("/:id/password", isLoggedIn, changePassword);

module.exports = router;
