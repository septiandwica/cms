const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const roleController = require("../controller/roleController"); 

const router = express.Router();

router.use(isLoggedIn, requireRoles(ROLES.ADMIN));

router.get("/", roleController.listRoles);

router.post("/", roleController.createRole);

router.get("/:id", roleController.getRoleById);

router.put("/:id", roleController.updateRole);

router.delete("/:id", roleController.deleteRole);

module.exports = router;
