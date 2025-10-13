// routes/users.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const userController = require("../controller/userController");

const router = express.Router();

// Profile diri sendiri
router.get("/me", isLoggedIn, userController.getMe);


// User yang diawasi oleh admin_department
router.get(
  "/department-managed",
  isLoggedIn,
  requireRoles(ROLES.ADMIN_DEPARTMENT),
  userController.getUsersByManagedDepartment
);

// daftar & detail
router.get(
  "/",
  isLoggedIn,
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR),
  userController.getAllUsers
);
router.get(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  userController.getUserById
);

// create/update/delete
router.post(
  "/",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  userController.createUser
);
router.put(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN, ROLES.ADMIN_DEPARTMENT),
  userController.updateUser
);
router.delete(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  userController.deleteUser
);

module.exports = router;
