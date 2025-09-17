const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
} = require("../controller/authController.js");

const { isLoggedIn } = require("../middleware/authMiddleware.js");
const { authLimiter,registerLimiter, loginLimiter } = require("../middleware/authLimiterMiddleware.js");

const router = express.Router();

router.use(authLimiter);

router.post("/register",registerLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);

// Logout
router.post("/logout", logoutUser);

router.patch("/:id/password", isLoggedIn, changePassword);

module.exports = router;
