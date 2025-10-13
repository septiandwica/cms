const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const roleController = require("../controller/roleController"); 

const router = express.Router();

router.use(isLoggedIn );

router.get("/",requireRoles(ROLES.ADMIN, ROLES.ADMIN_DEPARTMENT, ROLES.GENERAL_AFFAIR), roleController.listRoles);

router.post("/", requireRoles(ROLES.ADMIN), roleController.createRole);

router.get("/:id", requireRoles(ROLES.ADMIN), roleController.getRoleById);

router.put("/:id", requireRoles(ROLES.ADMIN), roleController.updateRole);

router.delete("/:id", requireRoles(ROLES.ADMIN), roleController.deleteRole);

module.exports = router;
