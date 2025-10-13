const QRCode = require("qrcode");
const { QR_Code, User, sequelize } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");
const { Order, Order_Detail, Meal_Menu } = require("../models");

// ============================================================
// 📘 LIST ALL QR CODES (ADMIN / MONITORING)
// ============================================================
async function listQRCode(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    // Optional filter by query string (?q=)
    const where = {};
    const q = (req.query.q || "").trim();
    if (q) where.qr_code_data = { [LIKE]: `%${q}%` };

    const { rows, count } = await QR_Code.findAndCountAll({
      where,
      include: [{ model: User, as: "user", attributes: { exclude: ["password"] } }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      qrCodes: rows.map((qr) => qr.get({ plain: true })),
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 📗 GET QR CODE BY ID
// ============================================================
async function getQRCodeById(req, res, next) {
  try {
    const qrCode = await QR_Code.findByPk(req.params.id, {
      include: [{ model: User, as: "user", attributes: { exclude: ["password"] } }],
    });
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });
    res.json({ qrCode: qrCode.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 🟢 CREATE QR CODE (Auto siteAddr, One per User)
// ============================================================
async function createQRCode(req, res, next) {
  try {
    const { user_id } = req.body;
    const userIdToUse = user_id || req.user.id;

    // 🔍 Pastikan user valid
    const user = await User.findByPk(userIdToUse);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 🚫 Cegah duplikasi QR
    const existingQR = await QR_Code.findOne({ where: { user_id: userIdToUse } });
    if (existingQR) {
      return res.status(200).json({
        message: "QR Code already exists for this user",
        qrCode: existingQR.get({ plain: true }),
      });
    }

    // 🌍 Ambil site address dari request (otomatis sesuai environment)
    const siteAddr = `${req.protocol}://${req.get("host")}`;

    // 🔗 URL tujuan QR Code (bisa diarahkan ke /scan untuk pemindaian)
    const userOrderUrl = `${siteAddr}/scan/${userIdToUse}`;

    // 🧾 Generate QR Code base64
    const qr_code_data = await QRCode.toDataURL(userOrderUrl);

    // 💾 Simpan ke database
    const qrCode = await QR_Code.create({
      user_id: userIdToUse,
      qr_code_data,
      used: false,
      last_used_date: null, // bisa null awalnya
    });

    // 🔁 Ambil kembali dengan relasi user
    const withInclude = await QR_Code.findByPk(qrCode.id, {
      include: [{ model: User, as: "user", attributes: { exclude: ["password"] } }],
    });

    res.status(201).json({
      message: "QR Code successfully generated",
      qrCode: withInclude.get({ plain: true }),
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 🟡 UPDATE QR CODE
// ============================================================
async function updateQRCode(req, res, next) {
  try {
    const { qr_code_data } = req.body;
    const qrCode = await QR_Code.findByPk(req.params.id);
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    if (qr_code_data) qrCode.qr_code_data = qr_code_data;

    await qrCode.save();

    const fresh = await QR_Code.findByPk(qrCode.id, {
      include: [{ model: User, as: "user", attributes: { exclude: ["password"] } }],
    });

    res.json({ qrCode: fresh.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 🔴 DELETE QR CODE
// ============================================================
async function deleteQRCode(req, res, next) {
  try {
    const qrCode = await QR_Code.findByPk(req.params.id);
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    await qrCode.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 🧾 SCAN QR CODE → Show Orders for Today
// ============================================================
// Ketika user scan QR, sistem:
// 1. Cari QR berdasarkan ID
// 2. Ambil semua order milik user untuk hari ini (berdasarkan field `day` di order_detail)
// 3. Tandai QR sebagai "used" hari ini agar tidak bisa dipakai dua kali
// ============================================================
async function scanQRCode(req, res, next) {
  try {
    const { qr_code_id } = req.params;
    const qrCode = await QR_Code.findByPk(qr_code_id, {
      include: [{ model: User, as: "user", attributes: { exclude: ["password"] } }],
    });

    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    const today = moment().format("YYYY-MM-DD");

    // Cari semua order milik user pada hari ini
    const ordersToday = await Order.findAll({
      where: { user_id: qrCode.user_id },
      include: [
        {
          model: Order_Detail,
          as: "order_details",
          required: true,
          where: { day: { [Op.eq]: today } },
          include: [{ model: Meal_Menu, as: "meal_menu" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!ordersToday.length) {
      return res.status(404).json({
        message: `No orders found for ${moment(today).format("dddd, DD MMMM YYYY")}.`,
      });
    }

    // Cek apakah sudah digunakan hari ini
    if (qrCode.last_used_date === today) {
      return res.status(400).json({
        message: "This QR Code has already been used today.",
        status: "used",
      });
    }

    // Update status QR jadi "used" untuk hari ini
    await qrCode.update({ used: true, last_used_date: today });

    res.json({
      message: `QR Code valid. Showing orders for ${moment(today).format("dddd, DD MMMM YYYY")}.`,
      status: "valid",
      orders: ordersToday.map((o) => o.get({ plain: true })),
    });
  } catch (err) {
    console.error("❌ Error in scanQRCode:", err);
    next(err);
  }
}
// ============================================================
// 🧍‍♂️ GET QR CODE MILIK USER YANG LOGIN
// ============================================================
// - Mengambil QR Code milik user yang sedang login
// - Jika belum ada, tidak membuat otomatis
// - URL QR tetap pakai site address dinamis
async function getMyQRCode(req, res, next) {
  try {
    const userId = req.user.id;

    // Cari QR milik user
    const qrCode = await QR_Code.findOne({
      where: { user_id: userId },
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    if (!qrCode) {
      return res.status(404).json({
        message: "QR Code not found for this user. Please generate one first.",
      });
    }

    // Pastikan URL dalam QR sesuai dengan environment aktif
    const siteAddr = `${req.protocol}://${req.get("host")}`;
    const expectedUrl = `${siteAddr}/scan/${userId}`;

    // Jika URL di database tidak sesuai, regenerate
    if (!qrCode.qr_code_data.includes(expectedUrl)) {
      const newQrData = await QRCode.toDataURL(expectedUrl);
      await qrCode.update({ qr_code_data: newQrData });
    }

    res.json({
      message: "QR Code retrieved successfully",
      qrCode: qrCode.get({ plain: true }),
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 🔁 GET OR CREATE QR CODE (Auto-generate jika belum ada)
// ============================================================
// - Jika user sudah punya QR, kembalikan yang lama
// - Jika belum, buat baru otomatis dengan siteAddr dinamis
// - Cegah duplikasi QR antar user
async function getOrCreateMyQRCode(req, res, next) {
  try {
    const userId = req.user.id;

    // Cari QR Code milik user
    let qrCode = await QR_Code.findOne({ where: { user_id: userId } });

    // Jika belum ada, buat baru
    if (!qrCode) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const siteAddr = `${req.protocol}://${req.get("host")}`;
      const userScanUrl = `${siteAddr}/scan/${userId}`;
      const qr_code_data = await QRCode.toDataURL(userScanUrl);

      qrCode = await QR_Code.create({
        user_id: userId,
        qr_code_data,
        used: false,
        last_used_date: null,
      });
    } else {
      // Pastikan QR Code sesuai environment saat ini
      const siteAddr = `${req.protocol}://${req.get("host")}`;
      const expectedUrl = `${siteAddr}/scan/${userId}`;
      if (!qrCode.qr_code_data.includes(expectedUrl)) {
        const newQrData = await QRCode.toDataURL(expectedUrl);
        await qrCode.update({ qr_code_data: newQrData });
      }
    }

    // Ambil ulang dengan relasi user
    const withInclude = await QR_Code.findByPk(qrCode.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    res.json({
      message: "QR Code ready",
      qrCode: withInclude.get({ plain: true }),
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// 📦 EXPORT ALL FUNCTIONS
// ============================================================
module.exports = {
  listQRCode,
  getQRCodeById,
  createQRCode,
  updateQRCode,
  deleteQRCode,
  scanQRCode,
  getMyQRCode,
  getOrCreateMyQRCode,
};
