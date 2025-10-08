// routes/users.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const userController = require("../controller/userController");

const router = express.Router();

router.get("/me", isLoggedIn, userController.getMe);

// daftar & detail
router.get("/", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), userController.getAllUsers);
router.get("/:id", isLoggedIn, requireRoles(ROLES.ADMIN), userController.getUserById);

// create/update/delete
router.post("/", isLoggedIn, requireRoles(ROLES.ADMIN), userController.createUser);
router.put("/:id", isLoggedIn, requireRoles(ROLES.ADMIN), userController.updateUser);
router.delete("/:id", isLoggedIn, requireRoles(ROLES.ADMIN), userController.deleteUser);



module.exports = router;
