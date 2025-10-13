const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const locationController = require("../controller/locationController");

const router = express.Router();

router.use(isLoggedIn);

router.get("/",  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT), locationController.listLocation);

router.post("/", requireRoles(ROLES.ADMIN), locationController.createLocation);

router.get("/:id",requireRoles(ROLES.ADMIN), locationController.getLocationById);

router.put("/:id",requireRoles(ROLES.ADMIN), locationController.updateLocation);

router.delete("/:id", requireRoles(ROLES.ADMIN),locationController.deleteLocation);

module.exports = router;
