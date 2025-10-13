// routes/orderDetails.js
const express = require("express");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { requireRoles, ROLES } = require("../middleware/roleMiddleware");
const orderDetailController = require("../controller/orderDetailController");

const router = express.Router();

router.use(isLoggedIn);

// ✅ Employee: hanya bisa melihat detail order miliknya
router.get(
  "/my",
  requireRoles(ROLES.EMPLOYEE),
  orderDetailController.listMyOrderDetails
);

// READ: admin & general_affair
router.get(
  "/",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR),
  orderDetailController.listOrderDetails
);

router.get(
  "/:id",
  requireRoles(ROLES.ADMIN, ROLES.GENERAL_AFFAIR),
  orderDetailController.getOrderDetailById
);

// WRITE: admin & vendor_catering (or other specific roles)
router.post(
  "/",
  requireRoles(ROLES.ADMIN, ROLES.VENDOR_CATERING),
  orderDetailController.createOrderDetail
);

router.put(
  "/:id",
  requireRoles(ROLES.ADMIN),
  orderDetailController.updateOrderDetail
);

router.delete(
  "/:id",
  requireRoles(ROLES.ADMIN),
  orderDetailController.deleteOrderDetail
);

module.exports = router;
