// routes/orders.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const orderController = require("../controller/orderController");

const router = express.Router();

router.use(isLoggedIn);

// =======================
// READ ROUTES
// =======================
// List all orders - accessible by admin, general_affair, admin_department, employee, vendor_catering
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

// Get order by ID - accessible by admin, general_affair, admin_department, employee, vendor_catering
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
// WRITE ROUTES
// =======================
// Create new order - accessible by admin, general_affair, admin_department, employee
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

// Update order status - accessible by admin, general_affair, admin_department
router.patch(
  "/:id", 
  requireRoles(
    ROLES.ADMIN, 
    ROLES.GENERAL_AFFAIR, 
    ROLES.ADMIN_DEPARTMENT
  ), 
  orderController.updateOrder
);

// Delete order - accessible by admin, general_affair, admin_department
router.delete(
  "/:id", 
  requireRoles(
    ROLES.ADMIN, 
    ROLES.GENERAL_AFFAIR, 
    ROLES.ADMIN_DEPARTMENT
  ), 
  orderController.deleteOrder
);

// =======================
// APPROVAL ROUTES
// =======================
// Approve single order - accessible by admin, general_affair, admin_department
router.patch(
  "/:id/approve", 
  requireRoles(
    ROLES.ADMIN, 
    ROLES.GENERAL_AFFAIR, 
    ROLES.ADMIN_DEPARTMENT
  ), 
  orderController.approveOrder
);

// Bulk approve orders - accessible by admin, general_affair, admin_department
router.post(
  "/bulk-approve", 
  requireRoles(
    ROLES.ADMIN, 
    ROLES.GENERAL_AFFAIR, 
    ROLES.ADMIN_DEPARTMENT
  ), 
  orderController.bulkApprove
);

module.exports = router;