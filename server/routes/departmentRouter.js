// routes/departments.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const departmentController = require("../controller/departmentController");

const router = express.Router();

// Seluruh endpoint di bawah: admin & general_affair
router.use(
  isLoggedIn
  
);

router.get("/", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT), departmentController.listDepartment);    
router.post("/", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR),departmentController.createDepartment);
router.get("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), departmentController.getDepartmentById);
router.put("/:id", requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), departmentController.updateDepartment);
router.delete("/:id",requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR), departmentController.deleteDepartment);

module.exports = router;
