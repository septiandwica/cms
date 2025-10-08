const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const attachVendorCatering = require("../middleware/vendorCateringContext");
const mealMenuController = require("../controller/mealMenuController");

const router = express.Router();

router.use(isLoggedIn);
router.use(attachVendorCatering); // <== HARUS sebelum route

router.post("/", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), mealMenuController.createMealMenu);
router.get("/", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.VENDOR_CATERING, ROLES.EMPLOYEE), mealMenuController.listMealMenus);
router.get("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.VENDOR_CATERING), mealMenuController.listMealMenus);
router.put("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.VENDOR_CATERING), mealMenuController.updateMealMenu);
router.delete("/:id", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), mealMenuController.deleteMealMenu);

module.exports = router;
