const moment = require('moment');
const { Op } = require('sequelize');
const { Order, User, Order_Detail, sequelize, Meal_Menu } = require("../models");


// =======================
// 📘 List Orders
// =======================
async function listOrders(req, res, next) {
  try {
    const { role, id: userId, department_id, vendor_id } = req.user;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    const where = {};
    const q = (req.query.q || "").trim();
    if (q) where.status = { [LIKE]: `%${q}%` };

    // Filter berdasarkan role
    let include = [
      { model: User, as: "user", attributes: { exclude: ["password"] } },
      { model: Order_Detail, as: "order_details", include: [{ model: Meal_Menu, as: "meal_menu" }] },
    ];

    if (role === 'employee') {
      where.user_id = userId;
    } else if (role === 'admin_department') {
      include[0].where = { department_id };
    } else if (role === 'vendor_catering') {
      include = [
        {
          model: User,
          as: "user",
          attributes: { exclude: ["password"] },
        },
        {
          model: Order_Detail,
          as: "order_details",
          required: true,
          include: [
            {
              model: Meal_Menu,
              as: "meal_menu",
              where: { vendor_id },
            },
          ],
        },
      ];
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      orders: rows.map(o => o.get({ plain: true })),
    });
  } catch (err) {
    next(err);
  }
}



// =======================
// 📗 Get Order by ID
// =======================
async function getOrderById(req, res, next) {
  try {
    const { role, id: userId, department_id, vendor_id } = req.user;

    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
        {
          model: Order_Detail,
          as: "order_details",
          include: [{ model: Meal_Menu, as: "meal_menu" }],
        },
      ],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🔒 Role-based access control
    if (role === 'employee' && order.user_id !== userId)
      return res.status(403).json({ message: "Unauthorized access" });

    if (role === 'admin_department' && order.user.department_id !== department_id)
      return res.status(403).json({ message: "Unauthorized access" });

    if (role === 'vendor_catering') {
      const hasVendorMeals = order.order_details.some(
        d => d.meal_menu && d.meal_menu.vendor_id === vendor_id
      );
      if (!hasVendorMeals)
        return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({ order: order.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}



// =======================
// 🟢 Create Order
// =======================
async function createOrder(req, res, next) {
  const { role, id: userId } = req.user;
  if (!['admin', 'general_affair', 'employee', 'admin_department'].includes(role)) {
    return res.status(403).json({ message: "You are not allowed to create orders." });
  }

  const t = await sequelize.transaction();
  try {
    const today = moment();
    const currentDay = today.isoWeekday(); // 1=Mon, 3=Wed, 5=Fri

    if (currentDay < 3 || currentDay > 5) {
      return res.status(400).json({
        message: "Orders can only be created on Wednesday, Thursday, or Friday.",
      });
    }

    const nextMonday = moment().add(1, 'weeks').startOf('isoWeek');
    const nextFriday = moment(nextMonday).add(4, 'days');

    const existing = await Order.findOne({
      where: {
        user_id: userId,
        order_date: {
          [Op.between]: [nextMonday.format('YYYY-MM-DD'), nextFriday.format('YYYY-MM-DD')],
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        message: "You have already placed an order for next week.",
      });
    }

    const order = await Order.create({
      user_id: userId,
      order_date: today.format('YYYY-MM-DD'),
      status: 'pending',
    }, { transaction: t });

    const { orders } = req.body;
    const orderDetailsData = [];

    for (let i = 0; i < 5; i++) {
      const day = moment(nextMonday).add(i, 'days').format('YYYY-MM-DD');
      const orderDetail = orders[i];
      orderDetailsData.push({
        order_id: order.id,
        day,
        shift_id: orderDetail.shift_id,
        meal_menu_id: orderDetail.meal_menu_id,
      });
    }

    await Order_Detail.bulkCreate(orderDetailsData, { transaction: t });
    await t.commit();

    res.status(201).json({
      message: "Order successfully created for next week (Mon–Fri).",
      order_id: order.id,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}



// =======================
// 🟡 Update Order
// =======================
async function updateOrder(req, res, next) {
  try {
    const { role, id: userId, department_id } = req.user;
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (role === 'employee')
      return res.status(403).json({ message: "Employees cannot update orders." });

    if (role === 'admin_department' && order.user.department_id !== department_id)
      return res.status(403).json({ message: "Unauthorized access" });

    if (role === 'vendor_catering')
      return res.status(403).json({ message: "Vendors cannot update orders." });

    if (status) order.status = status;
    await order.save();

    res.json({ message: "Order updated", order });
  } catch (err) {
    next(err);
  }
}



// =======================
// 🔴 Delete Order
// =======================
async function deleteOrder(req, res, next) {
  try {
    const { role, department_id } = req.user;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (role === 'employee')
      return res.status(403).json({ message: "Employees cannot delete orders." });

    if (role === 'admin_department' && order.user.department_id !== department_id)
      return res.status(403).json({ message: "Unauthorized access" });

    if (role === 'vendor_catering')
      return res.status(403).json({ message: "Vendors cannot delete orders." });

    await Order_Detail.destroy({ where: { order_id: order.id } });
    await order.destroy();

    res.json({ success: true, message: "Order deleted successfully." });
  } catch (err) {
    next(err);
  }
}



// =======================
// ✅ Approve Single Order
// =======================
async function approveOrder(req, res, next) {
  try {
    const { role, department_id } = req.user;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!['admin', 'general_affair', 'admin_department'].includes(role))
      return res.status(403).json({ message: "You are not allowed to approve orders." });

    if (role === 'admin_department' && order.user.department_id !== department_id)
      return res.status(403).json({ message: "Unauthorized access" });

    order.status = 'approved';
    order.approved_at = new Date();
    await order.save();

    res.json({ message: "Order approved successfully.", order });
  } catch (err) {
    next(err);
  }
}



// =======================
// ✅ Bulk Approve Orders
// =======================
async function bulkApprove(req, res, next) {
  try {
    const { role, department_id } = req.user;
    const { order_ids } = req.body;

    if (!Array.isArray(order_ids) || order_ids.length === 0)
      return res.status(400).json({ message: "order_ids must be a non-empty array." });

    if (!['admin', 'general_affair', 'admin_department'].includes(role))
      return res.status(403).json({ message: "You are not allowed to bulk approve." });

    // Ambil semua order
    const orders = await Order.findAll({
      where: { id: { [Op.in]: order_ids } },
      include: [{ model: User, as: "user" }],
    });

    // Filter sesuai role
    const allowedOrders = orders.filter(order => {
      if (role === 'admin_department')
        return order.user.department_id === department_id;
      return true; // admin & general_affair -> semua
    });

    if (allowedOrders.length === 0)
      return res.status(403).json({ message: "No orders available for approval." });

    const idsToApprove = allowedOrders.map(o => o.id);
    await Order.update(
      { status: 'approved', approved_at: new Date() },
      { where: { id: { [Op.in]: idsToApprove } } }
    );

    res.json({
      message: `Approved ${idsToApprove.length} order(s) successfully.`,
      approved_ids: idsToApprove,
    });
  } catch (err) {
    next(err);
  }
}



module.exports = {
  listOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  approveOrder,
  bulkApprove,
};
