// routes/departments.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const departmentController = require("../controller/departmentController");

const router = express.Router();

// Seluruh endpoint di bawah: admin & general_affair
router.use(
  isLoggedIn,
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR)
);

router.get("/", departmentController.listDepartment);    
router.post("/", departmentController.createDepartment);
router.get("/:id", departmentController.getDepartmentById);
router.put("/:id", departmentController.updateDepartment);
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
