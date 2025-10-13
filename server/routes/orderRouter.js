const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const orderController = require("../controller/orderController");

const router = express.Router();

// Middleware global — semua route harus login
router.use(isLoggedIn);

// =======================
// 📘 READ ROUTES
// =======================

// ✅ Check if user has ordered for a given week
router.get(
  "/check",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.ADMIN_DEPARTMENT,
    ROLES.EMPLOYEE
  ),
  orderController.checkWeeklyOrder
);

// ✅ List my orders (user-specific)
router.get(
  "/my",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.ADMIN_DEPARTMENT,
    ROLES.EMPLOYEE,
    ROLES.VENDOR_CATERING
  ),
  orderController.listMyOrders
);

// ✅ List all orders (with filters & pagination)
router.get(
  "/",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.ADMIN_DEPARTMENT,
    ROLES.EMPLOYEE,
    ROLES.VENDOR_CATERING
  ),
  orderController.listOrders
);

// ✅ Get single order detail
router.get(
  "/:id",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.ADMIN_DEPARTMENT,
    ROLES.EMPLOYEE,
    ROLES.VENDOR_CATERING
  ),
  orderController.getOrderById
);

// =======================
// 🟢 WRITE ROUTES
// =======================

// ✅ Create normal weekly order (employee)
router.post(
  "/",
  requireRoles(
    ROLES.ADMIN,
    ROLES.GENERAL_AFFAIR,
    ROLES.ADMIN_DEPARTMENT,
    ROLES.EMPLOYEE
  ),
  orderController.createOrder
);

// ✅ Create overtime order (admin_department only)
router.post(
  "/overtime",
  requireRoles(ROLES.ADMIN_DEPARTMENT),
  orderController.createOvertimeOrder
);

// ✅ Create guest order (admin / GA / admin_department)
router.post(
  "/guest",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.createGuestOrder
);

// ✅ Create backup order (for missing employees)
router.post(
  "/backup",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.createBackupOrders
);

// =======================
// ✏️ UPDATE & DELETE
// =======================

// ✅ Update order status (admin roles only)
router.patch(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.updateOrder
);

// ✅ Delete order (admin roles only)
router.delete(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.deleteOrder
);

// =======================
// ✅ APPROVAL ROUTES
// =======================

// Single approve
router.patch(
  "/:id/approve",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.approveOrder
);

// Bulk approve
router.post(
  "/bulk-approve",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.bulkApprove
);

// =======================
// 📊 STATS ROUTE
// =======================

// Count employees ordered vs not ordered
router.get(
  "/stats/count",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR, ROLES.ADMIN_DEPARTMENT),
  orderController.countOrderStatus
);

module.exports = router;
