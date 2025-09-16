const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const locationController = require("../controller/locationController"); 

const router = express.Router();

router.get(
  "/list",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  locationController.listLocation
);

router.post(
  "/create",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  locationController.createLocation
);

router.get(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  locationController.getLocationById
);

router.put(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  locationController.updateLocation
);

router.delete(
  "/:id",
  isLoggedIn,
  requireRoles(ROLES.ADMIN),
  locationController.deleteLocation
);

module.exports = router;
