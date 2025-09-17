// routes/shifts.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const shiftController = require("../controller/shiftController");

const router = express.Router();

router.use(isLoggedIn);

// READ (list/detail) — ADMIN & GA
router.get("/list",    requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), shiftController.listShifts);
router.get("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), shiftController.getShiftById);

// WRITE (create/update/delete) — ADMIN & GA
router.post("/create",     requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), shiftController.createShift);
router.put("/:id",   requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), shiftController.updateShift);
router.delete("/:id",requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), shiftController.deleteShift);

module.exports = router;
