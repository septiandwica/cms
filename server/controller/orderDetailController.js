const { Order_Detail, Order, Shift, Meal_Menu } = require("../models");

// List Order Details for a specific order
async function listOrderDetails(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    // Mendapatkan semua order details tanpa filter order_id
    const { rows, count } = await Order_Detail.findAndCountAll({
      include: [
        { model: Shift, as: "shift" },
        { model: Meal_Menu, as: "meal_menu" }
      ],
      limit,
      offset,
      order: [["day", "ASC"]], // Mengurutkan berdasarkan hari
    });

    if (count === 0) {
      return res.status(404).json({ message: "No order details found" });
    }

    // Mengembalikan hasil dalam format JSON dengan pagination
    res.json({
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      orderDetails: rows.map(orderDetail => orderDetail.get({ plain: true }))
    });
  } catch (err) {
    next(err);
  }
}
// =============================
// 🔒 List Order Details milik user login
// =============================
async function listMyOrderDetails(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ambil semua order milik user login
    const userOrders = await Order.findAll({
      where: { user_id: userId },
      attributes: ["id"], // kita cuma butuh ID order-nya
    });

    if (!userOrders.length) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    const orderIds = userOrders.map((o) => o.id);

    const orderDetails = await Order_Detail.findAll({
      where: { order_id: orderIds },
      include: [
        { model: Shift, as: "shift" },
        {
          model: Meal_Menu,
          as: "meal_menu",
          include: ["vendor_catering"],
        },
        {
          model: Order,
          as: "order",
          attributes: ["status", "createdAt"],
        },
      ],
      order: [["day", "ASC"]],
    });

    if (!orderDetails.length) {
      return res.status(404).json({ message: "No order details found" });
    }

    res.json({
      total: orderDetails.length,
      orderDetails: orderDetails.map((d) => d.get({ plain: true })),
    });
  } catch (error) {
    console.error("🔥 Error fetching my order details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Create Order Detail
async function createOrderDetail(req, res, next) {
  try {
    const { order_id, day, shift_id, meal_menu_id } = req.body;

    // Validasi apakah order_id valid
    const order = await Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validasi apakah shift_id valid
    const shift = await Shift.findByPk(shift_id);
    if (!shift) {
      return res.status(400).json({ message: "Shift not found" });
    }

    // Validasi apakah meal_menu_id valid
    const mealMenu = await Meal_Menu.findByPk(meal_menu_id);
    if (!mealMenu) {
      return res.status(400).json({ message: "Meal menu not found" });
    }

    // Membuat Order Detail
    const orderDetail = await Order_Detail.create({
      order_id,
      day,
      shift_id,
      meal_menu_id,
    });

    res.status(201).json({
      message: "Order detail successfully created.",
      orderDetail: orderDetail.get({ plain: true })
    });
  } catch (err) {
    next(err);
  }
}

// Get Order Detail by ID
async function getOrderDetailById(req, res, next) {
  try {
    const orderDetail = await Order_Detail.findByPk(req.params.id, {
      include: [
        { model: Shift, as: "shift" },
        { model: Meal_Menu, as: "meal_menu" },
      ],
    });

    if (!orderDetail) {
      return res.status(404).json({ message: "Order detail not found" });
    }

    res.json({ orderDetail: orderDetail.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// Update Order Detail
async function updateOrderDetail(req, res, next) {
  try {
    const { day, shift_id, meal_menu_id } = req.body;

    const orderDetail = await Order_Detail.findByPk(req.params.id);
    if (!orderDetail) {
      return res.status(404).json({ message: "Order detail not found" });
    }

    // Memastikan shift_id valid
    if (shift_id) {
      const shift = await Shift.findByPk(shift_id);
      if (!shift) {
        return res.status(400).json({ message: "Shift not found" });
      }
      orderDetail.shift_id = shift_id;
    }

    // Memastikan meal_menu_id valid
    if (meal_menu_id) {
      const mealMenu = await Meal_Menu.findByPk(meal_menu_id);
      if (!mealMenu) {
        return res.status(400).json({ message: "Meal menu not found" });
      }
      orderDetail.meal_menu_id = meal_menu_id;
    }

    // Memperbarui tanggal (day) jika diberikan
    if (day) {
      orderDetail.day = day;
    }

    await orderDetail.save();

    res.json({
      message: "Order detail successfully updated.",
      orderDetail: orderDetail.get({ plain: true })
    });
  } catch (err) {
    next(err);
  }
}

// Delete Order Detail
async function deleteOrderDetail(req, res, next) {
  try {
    const orderDetail = await Order_Detail.findByPk(req.params.id);
    if (!orderDetail) {
      return res.status(404).json({ message: "Order detail not found" });
    }

    await orderDetail.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listOrderDetails,
  createOrderDetail,
  getOrderDetailById,
  updateOrderDetail,
  deleteOrderDetail,
    listMyOrderDetails,
};
