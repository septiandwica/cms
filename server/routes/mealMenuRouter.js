// routes/mealMenus.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const ctrl = require("../controller/mealMenuController");

const router = express.Router();

router.use(isLoggedIn);

// READ: admin & general_affair
router.get("/list",  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), ctrl.listMealMenus);
router.get("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), ctrl.getMealMenuById);

// WRITE: admin & vendor_catering (atur sesuai policy kamu)
router.post("/create",  requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), ctrl.createMealMenu);
router.put("/:id", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), ctrl.updateMealMenu);
router.delete("/:id", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), ctrl.deleteMealMenu);

module.exports = router;
