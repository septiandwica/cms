// routes/vendorCateringRouter.js
const express = require("express");
const {
  listVendorCaterings,
  getVendorCateringById,
  createVendorCatering,
  updateVendorCatering,
  deleteVendorCatering,
} = require("../controller/vendorCateringController");
const { isLoggedIn } = require("../middleware/authMiddleware"); 
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");

const router = express.Router();

// List & detail (butuh login)
router.get("/", isLoggedIn, listVendorCaterings);
router.get("/:id", isLoggedIn, getVendorCateringById);

// Create/Update/Delete (contoh: admin & general_affair)
router.post("/", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), createVendorCatering);
router.put("/:id", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), updateVendorCatering);
router.patch("/:id", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), updateVendorCatering);
router.delete("/:id", isLoggedIn, requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), deleteVendorCatering);

module.exports = router;
