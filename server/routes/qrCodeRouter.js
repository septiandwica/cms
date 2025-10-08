const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const qrCodeController = require("../controller/qrCodeController");

const router = express.Router();

// Middleware untuk memastikan pengguna sudah login
router.use(isLoggedIn);
router.get(
  "/me",
  qrCodeController.getOrCreateMyQRCode
);

// READ: admin & general_affair
router.get("/", requireRoles(ROLES.ADMIN), qrCodeController.listQRCode);
router.get("/:id", requireRoles(ROLES.ADMIN), qrCodeController.getQRCodeById);

// WRITE: admin & vendor_catering (atau sesuai role kamu)
router.post("/", requireRoles(ROLES.ADMIN), qrCodeController.createQRCode);
router.put("/:id", requireRoles(ROLES.ADMIN), qrCodeController.updateQRCode);
router.delete("/:id", requireRoles(ROLES.ADMIN), qrCodeController.deleteQRCode);





module.exports = router;