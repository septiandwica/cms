const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const attachVendorCatering = require("../middleware/vendorCateringContext");
const mealMenuController = require("../controller/mealMenuController");
const upload = require("../middleware/uploadMiddleware"); // ✅ pastikan sudah dibuat

const router = express.Router();

router.use(isLoggedIn);
router.use(attachVendorCatering); // wajib sebelum semua route

// === CREATE ===
router.post(
  "/",
  requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING),
  mealMenuController.createMealMenu
);

// === BULK UPLOAD (CSV/Excel) ===
router.post(
  "/bulk",
  requireRoles(ROLES.VENDOR_CATERING),
  upload.single("file"), // gunakan field "file" di form
  mealMenuController.bulkCreateMealMenus
);

// === LIST ===
router.get(
  "/",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.VENDOR_CATERING,
  ),
  mealMenuController.listMealMenus
);
router.get(
  "/next-week",
  requireRoles(
    ROLES.EMPLOYEE
  ),
  mealMenuController.getNextWeekMenus
);
router.get(
  "/spare-ga",
  isLoggedIn,
  requireRoles(ROLES.GENERAL_AFFAIR, ROLES.ADMIN),
  mealMenuController.listForSpareGA
);


// === GET BY ID ===
router.get(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.VENDOR_CATERING),
  mealMenuController.getMealMenuById // ✅ diperbaiki (sebelumnya keliru panggil listMealMenus)
);

// === UPDATE ===
router.put(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.VENDOR_CATERING),
  mealMenuController.updateMealMenu
);

// === UPDATE STATUS ONLY ===
router.patch(
  "/:id/status",
  requireRoles(ROLES.GENERAL_AFFAIR, ROLES.ADMIN),
  mealMenuController.updateMealMenuStatus
);
router.patch(
  "/bulk-update-status",
  requireRoles(ROLES.GENERAL_AFFAIR, ROLES.ADMIN),
  mealMenuController.bulkUpdateMealMenuStatus
);

// === DELETE ===
router.delete(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING),
  mealMenuController.deleteMealMenu
);

module.exports = router;
