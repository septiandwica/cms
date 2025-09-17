const express = require("express");
const { registerUser, loginUser, logoutUser, changePassword } = require("../controller/authController.js");

const { isLoggedIn } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/logout", logoutUser);

// ganti password (boleh diri sendiri; admin bisa override)
router.patch("/:id/password", isLoggedIn, changePassword);



module.exports = router;