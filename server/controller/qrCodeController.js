const QRCode = require("qrcode");
const { QR_Code, User, sequelize } = require("../models");
const { Op } = require("sequelize");

// List QR Codes
async function listQRCode(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const where = {};
    const q = (req.query.q || "").trim();
    if (q) where.qr_code_data = { [LIKE]: `%${q}%` };

    const { rows, count } = await QR_Code.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const qrCodes = rows.map(qr => qr.get({ plain: true }));

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      qrCodes,
    });
  } catch (err) {
    next(err);
  }
}

// Get QR Code by ID
async function getQRCodeById(req, res, next) {
  try {
    const qrCode = await QR_Code.findByPk(req.params.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });
    res.json({ qrCode: qrCode.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// Create QR Code (Generated Once)
async function createQRCode(req, res, next) {
  try {
    const { user_id } = req.body;

    // If user_id is provided, ensure admin access, else generate for the logged-in user
    const userIdToUse = user_id || req.user.id;

    // Fetch user information based on user_id
    const user = await User.findByPk(userIdToUse);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate a unique URL that will point to the user's order details
    const userDetailUrl = `http://localhost:3000/user/${userIdToUse}/orders`;

    // Generate the QR Code (base64) for the user detail URL
    const qr_code_data = await QRCode.toDataURL(userDetailUrl);

    // Save the QR Code in the database
    const qrCode = await QR_Code.create({
      user_id: userIdToUse,
      qr_code_data,
      used: false, // Initially, QR code hasn't been used
    });

    const withInclude = await QR_Code.findByPk(qrCode.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    res.status(201).json({ qrCode: withInclude.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// Update QR Code
async function updateQRCode(req, res, next) {
  try {
    const { qr_code_data } = req.body;
    const qrCode = await QR_Code.findByPk(req.params.id);
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    if (qr_code_data != null) {
      qrCode.qr_code_data = qr_code_data;
    }

    await qrCode.save();

    const fresh = await QR_Code.findByPk(qrCode.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    res.json({ qrCode: fresh.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// Delete QR Code
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

// Scan QR Code and validate its usage
async function scanQRCode(req, res, next) {
  try {
    const { qr_code_id } = req.params;

    // Find the QR Code by ID
    const qrCode = await QR_Code.findByPk(qr_code_id);
    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found" });
    }

    // Check if the QR Code has already been used
    if (qrCode.used) {
      return res.status(400).json({
        message: "This QR Code has already been used today.",
        status: "used",
      });
    }

    // Mark the QR Code as used
    await qrCode.update({ used: true });

    res.json({
      message: "QR Code is valid. You can now proceed with your order.",
      status: "valid",
    });
  } catch (err) {
    next(err);
  }
}

async function getMyQRCode(req, res, next) {
  try {
    const userId = req.user.id;

    const qrCode = await QR_Code.findOne({
      where: { user_id: userId },
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found for this user" });
    }

    res.json({ qrCode: qrCode.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

async function getOrCreateMyQRCode(req, res, next) {
  try {
    const userId = req.user.id;

    let qrCode = await QR_Code.findOne({ where: { user_id: userId } });

    if (!qrCode) {
      // otomatis ambil site address dari request
      const siteAddr = `${req.protocol}://${req.get("host")}`;
      const userDetailUrl = `${siteAddr}/user/${userId}/orders`;

      const qr_code_data = await QRCode.toDataURL(userDetailUrl);

      qrCode = await QR_Code.create({
        user_id: userId,
        qr_code_data,
        used: false,
      });
    }

    const withInclude = await QR_Code.findByPk(qrCode.id, {
      include: [
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    res.json({ qrCode: withInclude.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}
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
