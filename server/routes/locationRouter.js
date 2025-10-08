const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const locationController = require("../controller/locationController");

const router = express.Router();

router.use(isLoggedIn, requireRoles(ROLES.ADMIN));

router.get("/", locationController.listLocation);

router.post("/", locationController.createLocation);

router.get("/:id", locationController.getLocationById);

router.put("/:id", locationController.updateLocation);

router.delete("/:id", locationController.deleteLocation);

module.exports = router;
