const moment = require("moment");
const { Op } = require("sequelize");
const db = require("../models");
const {
  Order,
  User,
  Order_Detail,
  sequelize,
  Meal_Menu,
} = require("../models");

// Helper — normalisasi role
function getRoleName(user) {
  const raw = user.role;
  return typeof raw === "string" ? raw : raw?.name;
}

// =======================
// 📘 List Orders (Enhanced & Filtered)
// =======================
async function listOrders(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { id: userId, department_id, vendor_id } = req.user;

    // 📄 Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    // 🔍 Search & Filter
    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    const where = {};
    const q = (req.query.q || "").trim();
    const type = (req.query.type || "").trim().toLowerCase();

    if (q) where.status = { [LIKE]: `%${q}%` };
    if (type && ["normal", "backup", "guest", "overtime"].includes(type))
      where.type = type;

    // 👀 Include relations
    let include = [
      {
        model: User,
        as: "user",
        attributes: { exclude: ["password"] },
        where: { status: { [Op.in]: ["active", "suspend"] } },
      },
      {
        model: Order_Detail,
        as: "order_details",
        include: [{ model: Meal_Menu, as: "meal_menu" }],
      },
    ];

    // 🧩 Role-based visibility
    if (roleName === "employee") {
      where.user_id = userId;
    } else if (roleName === "admin_department") {
      include[0].where.department_id = department_id;
    } else if (roleName === "vendor_catering") {
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

    // 🗃️ Fetch orders
    const { rows, count } = await Order.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // 🧾 Response
    res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      filters: {
        q: q || null,
        type: type || "all",
        role: roleName,
      },
      orders: rows.map((o) => o.get({ plain: true })),
    });
  } catch (err) {
    console.error("🔥 Error in listOrders:", err);
    next(err);
  }
}

// =======================
// 📘 List Orders by Logged-in User
// =======================
async function listMyOrders(req, res, next) {
  try {
    const { id } = req.user;
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.findAll({
      where: { user_id: id },
      include: [
        {
          model: Order_Detail,
          as: "order_details",
          include: [{ model: Meal_Menu, as: "meal_menu" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!orders.length)
      return res.status(404).json({ message: "Order not found" });

    res.json({
      total: orders.length,
      orders: orders.map((o) => o.get({ plain: true })),
    });
  } catch (error) {
    console.error("🔥 Error in listMyOrders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// =======================
// 📗 Get Order by ID
// =======================
async function getOrderById(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { id: userId, department_id, vendor_id } = req.user;

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

    // Role-based access
    if (roleName === "employee" && order.user_id !== userId)
      return res.status(403).json({ message: "Unauthorized access" });

    if (
      roleName === "admin_department" &&
      order.user.department_id !== department_id
    )
      return res.status(403).json({ message: "Unauthorized access" });

    if (roleName === "vendor_catering") {
      const hasVendorMeals = order.order_details.some(
        (d) => d.meal_menu && d.meal_menu.vendor_id === vendor_id
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
// 📊 Check Weekly Order
// =======================
async function checkWeeklyOrder(req, res) {
  try {
    const userId = req.user.id;
    const { week_start } = req.query;

    if (!week_start)
      return res
        .status(400)
        .json({ message: "week_start parameter is required" });

    const weekStart = moment(week_start).startOf("isoWeek");
    const weekEnd = moment(week_start).endOf("isoWeek").subtract(2, "days");

    const existingOrder = await Order.findOne({
      where: { user_id: userId },
      include: [
        {
          model: Order_Detail,
          as: "order_details",
          required: true,
          where: {
            day: {
              [Op.between]: [
                weekStart.format("YYYY-MM-DD"),
                weekEnd.format("YYYY-MM-DD"),
              ],
            },
          },
        },
      ],
    });

    return res.json({
      alreadyOrdered: !!existingOrder,
      message: existingOrder
        ? `You have already placed an order for ${weekStart.format(
            "MMM D"
          )}–${weekEnd.format("D")}.`
        : `No orders found for the week of ${weekStart.format(
            "MMM D"
          )}–${weekEnd.format("D")}.`,
    });
  } catch (error) {
    console.error("Error checking weekly order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// =======================
// 🟢 CREATE ORDER (active/suspend only)
// =======================
async function createOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: db.Role, as: "role" }],
    });

    if (
      !user ||
      user.role.name !== "employee" ||
      !["active", "suspend"].includes(user.status)
    ) {
      return res
        .status(403)
        .json({ message: "Only active/suspended employees can order." });
    }

    const today = moment();
    const currentDay = today.isoWeekday();
    if (currentDay < 4 || currentDay > 5)
      return res
        .status(400)
        .json({ message: "Orders allowed only Thursday or Friday." });

    const nextMonday = moment().add(1, "weeks").startOf("isoWeek");
    const nextFriday = moment(nextMonday).add(4, "days");

    const exists = await Order.findOne({
      where: { user_id: user.id },
      include: [
        {
          model: Order_Detail,
          as: "order_details",
          required: true,
          where: {
            day: {
              [Op.between]: [
                nextMonday.format("YYYY-MM-DD"),
                nextFriday.format("YYYY-MM-DD"),
              ],
            },
          },
        },
      ],
    });

    if (exists)
      return res
        .status(400)
        .json({ message: "Already ordered for next week." });

    const order = await Order.create(
      {
        user_id: user.id,
        order_date: today.format("YYYY-MM-DD"),
        status: "pending",
      },
      { transaction: t }
    );

    const { orders } = req.body;
    const details = [];
    for (let i = 0; i < 5; i++) {
      const day = moment(nextMonday).add(i, "days").format("YYYY-MM-DD");
      details.push({
        order_id: order.id,
        day,
        shift_id: orders[i].shift_id,
        meal_menu_id: orders[i].meal_menu_id,
      });
    }

    await Order_Detail.bulkCreate(details, { transaction: t });
    await t.commit();

    res.status(201).json({
      message: `Order created for ${nextMonday.format(
        "MMM D"
      )}–${nextFriday.format("D")}.`,
      order_id: order.id,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

// =======================
// 📊 Count Ordered vs Not Ordered (active/suspend only)
// =======================
async function countOrderStatus(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;

    const weekStart = moment().startOf("isoWeek").add(7, "days");
    const weekEnd = moment(weekStart).add(4, "days");

    const userFilter = {
      status: { [Op.in]: ["active", "suspend"] },
    };
    if (roleName === "admin_department")
      userFilter.department_id = department_id;

    const employees = await db.User.findAll({
      include: [
        {
          model: db.Role,
          as: "role",
          where: { name: "employee" },
          attributes: [],
        },
      ],
      where: userFilter,
    });

    const orders = await db.Order.findAll({
      include: [
        {
          model: db.Order_Detail,
          as: "order_details",
          required: true,
          where: {
            day: {
              [Op.between]: [
                weekStart.format("YYYY-MM-DD"),
                weekEnd.format("YYYY-MM-DD"),
              ],
            },
          },
        },
        {
          model: db.User,
          as: "user",
          where: userFilter,
        },
      ],
    });

    const usersWithOrder = [...new Set(orders.map((o) => o.user_id))];
    const totalEmployees = employees.length;
    const totalOrdered = usersWithOrder.length;
    const totalNotOrdered = totalEmployees - totalOrdered;

    res.json({
      week: `${weekStart.format("MMM D")}–${weekEnd.format("D")}`,
      totalEmployees,
      totalOrdered,
      totalNotOrdered,
    });
  } catch (err) {
    next(err);
  }
}
// =======================
// ⏱️ CREATE OVERTIME ORDER (by admin_department)
// =======================
async function createOvertimeOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const rawRole = req.user.role;
    const roleName = typeof rawRole === "string" ? rawRole : rawRole?.name;
    const { employee_id, date, shifts, meal_menu_ids, notes } = req.body;

    // 🔒 Role validation
    if (roleName !== "admin_department")
      return res.status(403).json({
        message: "Only admin_department can create overtime orders.",
      });

    // 🔒 Required fields
    if (!employee_id || !date)
      return res
        .status(400)
        .json({ message: "employee_id and date are required." });

    // 🔒 Validate arrays after extraction
    if (!Array.isArray(shifts) || !shifts.length)
      return res.status(400).json({ message: "Shifts are required." });

    if (!Array.isArray(meal_menu_ids) || !meal_menu_ids.length)
      return res.status(400).json({ message: "Meal menu IDs are required." });

    // 🔍 Check employee validity
    const employee = await db.User.findByPk(employee_id, {
      include: [{ model: db.Role, as: "role" }],
    });

    if (!employee || employee.role.name !== "employee")
      return res.status(400).json({ message: "Invalid employee." });

    if (!["active", "suspend"].includes(employee.status))
      return res
        .status(400)
        .json({ message: "Employee is not active or suspended." });

    // 🧾 Create order record
    const order = await Order.create(
      {
        user_id: employee.id,
        order_date: moment().format("YYYY-MM-DD"),
        type: "overtime",
        status: "pending",
        notes: notes || "Lembur",
      },
      { transaction: t }
    );

    // 🧾 Create details (multi-shift & multi-menu)
    const details = [];
    for (const shift_id of shifts) {
      for (const menuId of meal_menu_ids) {
        details.push({
          order_id: order.id,
          day: moment(date).format("YYYY-MM-DD"),
          shift_id,
          meal_menu_id: menuId,
        });
      }
    }

    await Order_Detail.bulkCreate(details, { transaction: t });
    await t.commit();

    // ✅ Success response
    res.status(201).json({
      message: `Overtime order created for ${employee.name} (${moment(date).format(
        "DD MMM YYYY"
      )}).`,
      order_id: order.id,
    });
  } catch (err) {
    await t.rollback();
    console.error("🔥 Error in createOvertimeOrder:", err);
    next(err);
  }
}


// =======================
// 👤 CREATE GUEST ORDER (by admin_department)
// =======================
async function createGuestOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const rawRole = req.user.role;
    const roleName = typeof rawRole === "string" ? rawRole : rawRole?.name;

    if (!["admin", "general_affair", "admin_department"].includes(roleName)) {
      return res
        .status(403)
        .json({ message: "Unauthorized: only admin can create guest orders." });
    }

    const { days, shifts, meal_menu_ids, notes } = req.body;

    if (!Array.isArray(days) || !days.length)
      return res.status(400).json({ message: "Days array is required." });

    if (!Array.isArray(shifts) || !shifts.length)
      return res.status(400).json({ message: "Shifts array is required." });

    if (!Array.isArray(meal_menu_ids) || !meal_menu_ids.length)
      return res.status(400).json({ message: "Meal menu IDs are required." });

    // Buat 1 order untuk semua hari (1 minggu, misal Senin–Rabu)
    const order = await Order.create(
      {
        user_id: req.user.id, // gunakan ID admin
        order_date: moment().format("YYYY-MM-DD"),
        type: "guest",
        status: "pending",
        notes: notes || null,
      },
      { transaction: t }
    );

    const details = [];

    // days bisa berisi tanggal spesifik (["2025-10-13", "2025-10-14"])
    for (const day of days) {
      for (const shift_id of shifts) {
        for (const menuId of meal_menu_ids) {
          details.push({
            order_id: order.id,
            day: moment(day).format("YYYY-MM-DD"),
            shift_id,
            meal_menu_id: menuId,
          });
        }
      }
    }

    await Order_Detail.bulkCreate(details, { transaction: t });
    await t.commit();

    res.status(201).json({
      message: `Guest order created successfully for ${days.length} day(s).`,
      order_id: order.id,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

// =======================
// 🍱 CREATE BACKUP ORDERS (active/suspend only)
// =======================
async function createBackupOrders(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { department_id } = req.user;
    const roleName = getRoleName(req.user);

    if (!["admin", "general_affair", "admin_department"].includes(roleName))
      return res.status(403).json({ message: "Not authorized." });

    const today = moment();
    const currentDay = today.isoWeekday();
    if (currentDay < 3 || currentDay > 5)
      return res.status(400).json({ message: "Backup orders only Wed–Fri." });

    const weekStart = moment().startOf("isoWeek").add(7, "days");
    const weekEnd = moment(weekStart).add(4, "days");

    const userFilter = {
      status: { [Op.in]: ["active", "suspend"] },
    };
    if (roleName === "admin_department")
      userFilter.department_id = department_id;

    const employees = await db.User.findAll({
      include: [
        {
          model: db.Role,
          as: "role",
          where: { name: "employee" },
          attributes: [],
        },
      ],
      where: userFilter,
    });

    if (!employees.length)
      return res.status(404).json({
        message:
          roleName === "admin_department"
            ? "No active/suspended employees in your department."
            : "No active/suspended employees found.",
      });

    const orders = await db.Order.findAll({
      include: [
        {
          model: db.Order_Detail,
          as: "order_details",
          required: true,
          where: {
            day: {
              [Op.between]: [
                weekStart.format("YYYY-MM-DD"),
                weekEnd.format("YYYY-MM-DD"),
              ],
            },
          },
        },
        { model: db.User, as: "user", where: userFilter },
      ],
    });

    const orderedUserIds = [...new Set(orders.map((o) => o.user_id))];
    const usersWithoutOrder = employees.filter(
      (u) => !orderedUserIds.includes(u.id)
    );

    if (!usersWithoutOrder.length)
      return res.json({
        message:
          roleName === "admin_department"
            ? "All employees in your department already ordered."
            : "All employees already ordered.",
      });

    const mealMenus = await db.Meal_Menu.findAll({
      where: { status: "approved" },
    });
    if (!mealMenus.length)
      return res.status(400).json({ message: "No available meal menus." });

    const backupOrders = [];
    for (const user of usersWithoutOrder) {
      const order = await db.Order.create(
        {
          user_id: user.id,
          order_date: today.format("YYYY-MM-DD"),
          status: "backup",
        },
        { transaction: t }
      );

      const details = [];
      for (let i = 0; i < 5; i++) {
        const day = moment(weekStart).add(i, "days").format("YYYY-MM-DD");
        const randomMenu =
          mealMenus[Math.floor(Math.random() * mealMenus.length)];
        details.push({
          order_id: order.id,
          day,
          shift_id: 1,
          meal_menu_id: randomMenu.id,
        });
      }

      await db.Order_Detail.bulkCreate(details, { transaction: t });
      backupOrders.push(order.id);
    }

    await t.commit();

    res.json({
      message: `🍱 Created backup orders for ${
        usersWithoutOrder.length
      } active/suspended employees ${
        roleName === "admin_department"
          ? "in your department"
          : "across all departments"
      } for ${weekStart.format("MMM D")}–${weekEnd.format("D")}.`,
      order_ids: backupOrders,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
}

// =======================
// 🟡 Update, Delete, Approve (unchanged except normalized role)
// =======================
async function updateOrder(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (roleName === "employee" || roleName === "vendor_catering")
      return res.status(403).json({ message: "Not authorized to update." });

    if (
      roleName === "admin_department" &&
      order.user.department_id !== department_id
    )
      return res.status(403).json({ message: "Unauthorized access." });

    if (status) order.status = status;
    await order.save();

    res.json({ message: "Order updated", order });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (roleName === "employee" || roleName === "vendor_catering")
      return res.status(403).json({ message: "Not authorized to delete." });

    if (
      roleName === "admin_department" &&
      order.user.department_id !== department_id
    )
      return res.status(403).json({ message: "Unauthorized access." });

    await Order_Detail.destroy({ where: { order_id: order.id } });
    await order.destroy();

    res.json({ success: true, message: "Order deleted successfully." });
  } catch (err) {
    next(err);
  }
}

async function approveOrder(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["admin", "general_affair", "admin_department"].includes(roleName))
      return res.status(403).json({ message: "Not allowed to approve." });

    if (
      roleName === "admin_department" &&
      order.user.department_id !== department_id
    )
      return res.status(403).json({ message: "Unauthorized access." });

    order.status = "approved";
    order.approved_at = new Date();
    await order.save();

    res.json({ message: "Order approved successfully.", order });
  } catch (err) {
    next(err);
  }
}

async function bulkApprove(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;
    const { order_ids } = req.body;

    if (!Array.isArray(order_ids) || !order_ids.length)
      return res
        .status(400)
        .json({ message: "order_ids must be a non-empty array." });

    if (!["admin", "general_affair", "admin_department"].includes(roleName))
      return res.status(403).json({ message: "Not allowed to bulk approve." });

    const orders = await Order.findAll({
      where: { id: { [Op.in]: order_ids } },
      include: [{ model: User, as: "user" }],
    });

    const allowed = orders.filter((o) =>
      roleName === "admin_department"
        ? o.user.department_id === department_id
        : true
    );

    if (!allowed.length)
      return res
        .status(403)
        .json({ message: "No orders available for approval." });

    const ids = allowed.map((o) => o.id);
    await Order.update(
      { status: "approved", approved_at: new Date() },
      { where: { id: { [Op.in]: ids } } }
    );

    res.json({
      message: `Approved ${ids.length} orders successfully.`,
      approved_ids: ids,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrders,
  listMyOrders,
  getOrderById,
  checkWeeklyOrder,
  createOrder,
  createBackupOrders,
  createOvertimeOrder,
  createGuestOrder,
  countOrderStatus,
  updateOrder,
  deleteOrder,
  approveOrder,
  bulkApprove,
};
