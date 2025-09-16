const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const roleController = require("../controller/roleController"); // pastikan path benar

const router = express.Router();

router.get(
  "/list",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  roleController.listRoles
);

router.post(
  "/create",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  roleController.createRole
);

router.get(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  roleController.getRoleById
);

router.put(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  roleController.updateRole
);

router.delete(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  roleController.deleteRole
);

module.exports = router;
