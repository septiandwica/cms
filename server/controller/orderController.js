const moment = require("moment");
const { Op } = require("sequelize");
const db = require("../models");
const {
  Order,
  User,
  Role,
  Order_Detail,
  sequelize,
  Meal_Menu,
  Department,
  Location
} = require("../models");

// Helper — normalisasi role
function getRoleName(user) {
  const raw = user.role;
  return typeof raw === "string" ? raw : raw?.name;
}

// =======================
// 📘 List Orders 
// =======================
async function listOrders(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { id: userId, department_id, vendor_catering_id } = req.user;

    // 📄 Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    // 🔍 Filter dasar
    const where = {};
    const type = (req.query.type || "").trim().toLowerCase();
    if (type && ["normal", "backup", "guest", "overtime"].includes(type)) {
      where.type = type;
    }

    // 👀 Include Relations
    let include = [
      {
        model: User,
        as: "user",
        attributes: { exclude: ["password"] },
        include: [
          {
            model: db.Department,
            as: "department",
            include: [{ model: db.Location, as: "location" }],
          },
        ],
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
              where: { vendor_catering_id },
            },
          ],
        },
      ];
    }

    // 🏢 Filter Department (admin / general_affair)
    if (req.query.department_id) {
      const departmentId = parseInt(req.query.department_id, 10);
      if (!isNaN(departmentId)) {
        if (!include[0].where) include[0].where = {};
        include[0].where.department_id = departmentId;
      }
    }

    // 📍 Filter lokasi untuk General Affair
    if (roleName === "general_affair") {
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: db.Department,
            as: "department",
            include: [{ model: db.Location, as: "location" }],
          },
        ],
      });

      const userLocationId = user?.department?.location_id;
      if (userLocationId) {
        include[0].include[0].where = { location_id: userLocationId };
      }
    }

    // 🗃️ Fetch Orders
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
        type: type || "all",
        role: roleName,
      },
      orders: rows.map((o) => {
        const order = o.get({ plain: true });
        // 🔒 Employee tidak lihat menu detail pada backup order
        if (roleName === "employee" && order.type === "backup") {
          order.order_details = order.order_details.map((d) => ({
            id: d.id,
            day: d.day,
            shift_id: d.shift_id,
            meal_menu_id: d.meal_menu_id,
            meal_menu: null,
          }));
        }
        return order;
      }),
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
  orders: orders.map((o) => {
    const order = o.get({ plain: true });
    // 🔒 Employee tidak tahu isi menu backup
    if (req.user.role?.name === "employee" && order.type === "backup") {
      order.order_details = order.order_details.map((d) => ({
        id: d.id,
        day: d.day,
        shift_id: d.shift_id,
        meal_menu_id: d.meal_menu_id,
        meal_menu: null,
      }));
    }
    return order;
  }),
});
  } catch (error) {
    console.error("🔥 Error in listMyOrders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// =======================
// 📦 List Orders for Vendor Catering (by vendor_catering.id)
// =======================
async function listVendorOrders(req, res, next) {
  try {
    const user = req.user;
    const roleName = user.role?.name;

    // ✅ Only vendor_catering role allowed
    if (roleName !== "vendor_catering") {
      return res.status(403).json({
        message: "Only vendor catering can access this list.",
      });
    }

    const vendor = user.vendor_catering;
    if (!vendor?.id) {
      return res
        .status(400)
        .json({ message: "Vendor data not found in your account." });
    }

    // ✅ Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 25, 1),
      100
    );
    const offset = (page - 1) * limit;

    // ✅ Date range (weekly)
    const start = req.query.start
      ? moment(req.query.start).startOf("day")
      : moment().startOf("week");
    const end = req.query.end
      ? moment(req.query.end).endOf("day")
      : moment().endOf("week");

    // ✅ Filter only approved orders
    const where = { status: "approved" };

    // ✅ Get orders including order details for this vendor
    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
          include: [
            {
              model: Department,
              as: "department",
              include: [{ model: Location, as: "location" }],
            },
          ],
        },
        {
          model: Order_Detail,
          as: "order_details",
          required: true,
          where: {
            day: {
              [Op.between]: [
                start.format("YYYY-MM-DD"),
                end.format("YYYY-MM-DD"),
              ],
            },
          },
          separate: true,
          include: [
            {
              model: Meal_Menu,
              as: "meal_menu",
              where: { vendor_catering_id: vendor.id },
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // ✅ Generate summary by menu
    const allDetails = rows.flatMap((o) => o.order_details);
    const summaryByMenu = allDetails.reduce((acc, detail) => {
      const menuName = detail.meal_menu?.name || "Unknown";
      acc[menuName] = (acc[menuName] || 0) + 1;
      return acc;
    }, {});

    // ✅ Find employees in same location & shift
    const employees = await User.findAll({
      include: [
        {
          model: Department,
          as: "department",
          include: [
            {
              model: Location,
              as: "location",
              where: { id: vendor.location_id },
            },
          ],
        },
        {
          model: Role,
          as: "role",
          where: { name: "employee" },
        },
      ],
      attributes: ["id", "name", "email"],
    });

    // ✅ Employees who already ordered
    const orderedUserIds = new Set(rows.map((o) => o.user.id));
    const notOrdered = employees.filter((e) => !orderedUserIds.has(e.id));

    // ✅ Response
    res.json({
      page,
      limit,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      vendor: vendor.name,
      location: vendor.location?.name,
      shift: vendor.shift?.name,
      period: {
        start: start.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD"),
      },
      summaryByMenu,
      notOrderedCount: notOrdered.length,
      notOrderedUsers: notOrdered.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })),
      orders: rows.map((o) => o.get({ plain: true })),
    });
  } catch (err) {
    console.error("🔥 Error in listVendorOrders:", err);
    next(err);
  }
}

// =======================
// 📗 Get Order by ID
// =======================
async function getOrderById(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { id: userId, department_id } = req.user;

    // ✅ Ambil vendorId dari relasi vendor_catering
    const vendorId = req.user.vendor_catering?.id || null;

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

    // 🔒 Role-based access
    if (roleName === "employee" && order.user_id !== userId)
      return res.status(403).json({ message: "Unauthorized access" });

    if (
      roleName === "admin_department" &&
      order.user.department_id !== department_id
    )
      return res.status(403).json({ message: "Unauthorized access" });

    if (roleName === "vendor_catering") {
      const hasVendorMeals = order.order_details.some(
        (d) =>
          d.meal_menu &&
          d.meal_menu.vendor_catering_id &&
          d.meal_menu.vendor_catering_id === vendorId // ✅ gunakan vendorId dari req.user.vendor_catering
      );

      if (!hasVendorMeals)
        return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({ order: order.get({ plain: true }) });
  } catch (err) {
    console.error("🔥 Error in getOrderById:", err);
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
// 📊 Weekly Order Summary (Approved only)
// =======================
async function weeklyOrderSummary(req, res, next) {
  try {
    const roleName = getRoleName(req.user);
    const { department_id } = req.user;

    if (
      !["admin", "general_affair", "admin_department", "vendor_catering"].includes(roleName)
    ) {
      return res.status(403).json({ message: "Unauthorized access." });
    }

    // 🎯 Target minggu depan (Senin–Jumat)
    const weekStart = moment().startOf("isoWeek").add(7, "days");
    const weekEnd = moment(weekStart).add(5, "days");

    // Filter untuk karyawan aktif/suspend
    const employeeFilter = {
      status: { [Op.in]: ["active", "suspend"] },
    };
    if (roleName === "admin_department") {
      employeeFilter.department_id = department_id;
    }

    // 🧍 Semua karyawan
    const employees = await User.findAll({
      include: [{ model: Role, as: "role", where: { name: "employee" } }],
      where: employeeFilter,
      attributes: ["id"],
    });

    // 📦 Order yang sudah approved
    const orders = await Order.findAll({
      where: { status: "approved" },
      include: [
        {
          model: User,
          as: "user",
          where: employeeFilter,
          include: [{ model: Role, as: "role", where: { name: "employee" } }],
        },
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
          include: [{ model: Meal_Menu, as: "meal_menu" }],
        },
      ],
    });

    // 🧮 Hitung total user order
    const orderedUserIds = [...new Set(orders.map((o) => o.user_id))];
    const totalEmployees = employees.length;
    const totalOrdered = orderedUserIds.length;
    const totalNotOrdered = totalEmployees - totalOrdered;

    // 🍱 Group berdasarkan hari
    const allDetails = orders.flatMap((o) => o.order_details);

    const groupedByDay = {};

    for (const detail of allDetails) {
      const dayKey = moment(detail.day).format("YYYY-MM-DD");
      const menuName = detail.meal_menu?.name || "Unknown";
      if (!groupedByDay[dayKey]) groupedByDay[dayKey] = {};
      groupedByDay[dayKey][menuName] = (groupedByDay[dayKey][menuName] || 0) + 1;
    }

    // 🚀 Format summary per hari
    const summaryByDay = Object.entries(groupedByDay).map(([day, menuSummary]) => ({
      day: `${day} (${moment(day).format("dddd")})`,
      totalMenus: Object.keys(menuSummary).length,
      menuSummary,
    }));

    // ✅ Response
    res.json({
      week: `${weekStart.format("MMM D")}–${weekEnd.format("D")}`,
      totalEmployees,
      totalOrdered,
      totalNotOrdered,
      summaryByDay,
    });
  } catch (err) {
    console.error("🔥 Error in weeklyOrderSummary:", err);
    next(err);
  }
}



// =======================
// 🟢 CREATE ORDER (active/suspend only)
// =======================
async function createOrder(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const roleName = getRoleName(req.user); // ✅ Tambahkan baris ini
    const user = await User.findByPk(req.user.id, {
      include: [{ model: db.Role, as: "role" }],
    });

    if (["vendor_catering"].includes(roleName))
      return res.status(403).json({ message: "Vendors are not allowed to create orders." });

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
    console.error("🔥 Error in createOrder:", err); // ✅ biar kelihatan di log server
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
  listVendorOrders,
  getOrderById,
  checkWeeklyOrder,
  createOrder,
  createOvertimeOrder,
  createGuestOrder,
  countOrderStatus,
  updateOrder,
  deleteOrder,
  approveOrder,
  bulkApprove,
  weeklyOrderSummary,
};
