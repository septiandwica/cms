const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const mealTrayController = require("../controller/mealTrayController");

const router = express.Router();

router.use(isLoggedIn);

// READ: admin & general_affair
router.get("/",  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR,ROLES.VENDOR_CATERING), mealTrayController.listMealTrays);
router.get("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), mealTrayController.getMealTrayById);

// WRITE: admin & vendor_catering (atur sesuai policy kamu)
router.post("/",  requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), mealTrayController.createMealTray);
router.put("/:id", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), mealTrayController.updateMealTray);
router.delete("/:id", requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING), mealTrayController.deleteMealTray);

module.exports = router;
