// controllers/vendorCateringController.js
const { Vendor_Catering, User, Location, Shift, sequelize } = require("../models");
const { Op } = require("sequelize");

/** GET /vendor-caterings
 * Query:
 *  - q (search by name/address)
 *  - status (active|inactive)
 *  - user_id, location_id, shift_id
 *  - page, limit
 */
const listVendorCaterings = async (req, res, next) => {
  try {
    const { q, status, user_id, location_id, shift_id } = req.query;

    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const where = {};
    const qTrim = (q || "").trim();
    if (qTrim) {
      where[Op.or] = [
        { name:    { [LIKE]: `%${qTrim}%` } },
        { address: { [LIKE]: `%${qTrim}%` } },
      ];
    }
    if (status)       where.status       = status;
    if (user_id)      where.user_id      = user_id;
    if (location_id)  where.location_id  = location_id;
    if (shift_id)     where.shift_id     = shift_id;

    const { rows, count } = await Vendor_Catering.findAndCountAll({
      where,
      include: [
        { model: User,     as: "user",     attributes: ["id", "name", "email"] },
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: Shift,    as: "shift",    attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const data = rows.map(r => r.get({ plain: true }));

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      vendor_caterings: data,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /vendor-caterings/:id */
const getVendorCateringById = async (req, res, next) => {
  try {
    const vc = await Vendor_Catering.findByPk(req.params.id, {
      include: [
        { model: User,     as: "user",     attributes: ["id", "name", "email"] },
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: Shift,    as: "shift",    attributes: ["id", "name"] },
      ],
    });
    if (!vc) return res.status(404).json({ message: "Vendor Catering not found" });

    return res.json({ vendor_catering: vc.get({ plain: true }) });
  } catch (err) {
    return next(err);
  }
};

/** POST /vendor-caterings
 * Body: { user_id, name, location_id, shift_id, address, status }
 */
const createVendorCatering = async (req, res, next) => {
  try {
    let { user_id, name, location_id, shift_id, address, status } = req.body;

    // Validasi input minimum
    if (!user_id || !name || !location_id || !shift_id) {
      return res.status(400).json({
        message: "user_id, name, location_id, and shift_id are required",
      });
    }

    // Normalisasi & default
    name = String(name).trim();
    if (!status) status = "active"; // default agar tidak null (DB enum not null)

    // Cek FK ada
    const [user, loc, shift] = await Promise.all([
      User.findByPk(user_id),
      Location.findByPk(location_id),
      Shift.findByPk(shift_id),
    ]);
    if (!user)  return res.status(400).json({ message: "Invalid user_id" });
    if (!loc)   return res.status(400).json({ message: "Invalid location_id" });
    if (!shift) return res.status(400).json({ message: "Invalid shift_id" });

    const created = await Vendor_Catering.create({
      user_id,
      name,
      location_id,
      shift_id,
      address,
      status,
    });

    return res.status(201).json({
      message: "Vendor Catering created",
      vendor_catering: created.get({ plain: true }),
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err?.errors?.[0]?.path || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (user_id/location_id/shift_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return next(err);
  }
};

/** PUT/PATCH /vendor-caterings/:id
 * Body (partial): { user_id, name, location_id, shift_id, address, status }
 */
const updateVendorCatering = async (req, res, next) => {
  try {
    const { user_id, name, location_id, shift_id, address, status } = req.body;

    const vc = await Vendor_Catering.findByPk(req.params.id);
    if (!vc) return res.status(404).json({ message: "Vendor Catering not found" });

    // Validasi FK jika dikirim
    if (user_id !== undefined) {
      const user = await User.findByPk(user_id);
      if (!user) return res.status(400).json({ message: "Invalid user_id" });
      vc.user_id = user_id;
    }
    if (location_id !== undefined) {
      const loc = await Location.findByPk(location_id);
      if (!loc) return res.status(400).json({ message: "Invalid location_id" });
      vc.location_id = location_id;
    }
    if (shift_id !== undefined) {
      const sh = await Shift.findByPk(shift_id);
      if (!sh) return res.status(400).json({ message: "Invalid shift_id" });
      vc.shift_id = shift_id;
    }

    if (name !== undefined)    vc.name    = String(name).trim();
    if (address !== undefined) vc.address = address;
    if (status !== undefined)  vc.status  = status; // pastikan enum valid di layer request validator bila ada

    await vc.save();

    return res.json({
      message: "Vendor Catering updated",
      vendor_catering: vc.get({ plain: true }),
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err?.errors?.[0]?.path || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (user_id/location_id/shift_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return next(err);
  }
};

/** DELETE /vendor-caterings/:id */
const deleteVendorCatering = async (req, res, next) => {
  try {
    const vc = await Vendor_Catering.findByPk(req.params.id);
    if (!vc) return res.status(404).json({ message: "Vendor Catering not found" });

    await vc.destroy();
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listVendorCaterings,
  getVendorCateringById,
  createVendorCatering,
  updateVendorCatering,
  deleteVendorCatering,
};
