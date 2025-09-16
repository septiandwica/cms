const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const { getAllUsers, getMe } = require("../controller/userController");

const router = express.Router();

router.get("/me", isLoggedIn, getMe);

router.get("/all", isLoggedIn, requireRoles(ROLES.ADMIN), getAllUsers);

router.get("/dashboard", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR));

module.exports = router;
