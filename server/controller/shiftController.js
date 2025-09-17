const { Shift, Vendor_Catering } = require("../models");
const { Op } = require("sequelize");

/** Helper */
function isValidTime(t) {
  // format "HH:MM" atau "HH:MM:SS"
  return typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t);
}

/** GET /shifts
 * Query:
 *  - q: cari by name (LIKE)
 *  - page, limit
 *  - withVendors=true untuk include relasi vendor_caterings
 */
const listShifts = async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    const q = req.query.q?.trim();
    if (q) where.name = { [Op.like]: `%${q}%` };

    const include = [];
    if (String(req.query.withVendors).toLowerCase() === "true") {
      include.push({
        model: Vendor_Catering,
        as: "vendor_caterings",
        attributes: ["id", "name", "shift_id"],
      });
    }

    const { rows, count } = await Shift.findAndCountAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const shifts = rows.map((r) => r.get({ plain: true }));

    res.json({
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      shifts,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /shifts/:id */
const getShiftById = async (req, res, next) => {
  try {
    const include = String(req.query.withVendors).toLowerCase() === "true"
      ? [{ model: Vendor_Catering, as: "vendor_caterings", attributes: ["id", "name", "shift_id"] }]
      : [];

    const shift = await Shift.findByPk(req.params.id, { include });
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    res.json({ shift: shift.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
};

/** POST /shifts
 * Body: { name, timeOn, startAt, endAt }
 */
const createShift = async (req, res, next) => {
  try {
    const { name, timeOn, startAt, endAt } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    if (startAt && !isValidTime(startAt)) {
      return res.status(400).json({ message: "startAt must be HH:MM or HH:MM:SS" });
    }
    if (endAt && !isValidTime(endAt)) {
      return res.status(400).json({ message: "endAt must be HH:MM or HH:MM:SS" });
    }
    if (timeOn && !isValidTime(timeOn)) {
      return res.status(400).json({ message: "timeOn must be HH:MM or HH:MM:SS" });
    }

    // Optional: cegah duplikasi name
    const exists = await Shift.findOne({ where: { name: name.trim() } });
    if (exists) {
      return res.status(409).json({ message: "Shift name already exists" });
    }

    const shift = await Shift.create({
      name: name.trim(),
      timeOn: timeOn || null,
      startAt: startAt || null,
      endAt: endAt || null,
    });

    res.status(201).json({ shift });
  } catch (err) {
    next(err);
  }
};

/** PUT /shifts/:id
 * Body: { name?, timeOn?, startAt?, endAt? }
 */
const updateShift = async (req, res, next) => {
  try {
    const { name, timeOn, startAt, endAt } = req.body;

    const shift = await Shift.findByPk(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({ message: "name cannot be empty" });
    }
    if (startAt && !isValidTime(startAt)) {
      return res.status(400).json({ message: "startAt must be HH:MM or HH:MM:SS" });
    }
    if (endAt && !isValidTime(endAt)) {
      return res.status(400).json({ message: "endAt must be HH:MM or HH:MM:SS" });
    }
    if (timeOn && !isValidTime(timeOn)) {
      return res.status(400).json({ message: "timeOn must be HH:MM or HH:MM:SS" });
    }

    // Optional: cek duplikasi name (jika diubah)
    if (name && name.trim() !== shift.name) {
      const exists = await Shift.findOne({ where: { name: name.trim(), id: { [Op.ne]: shift.id } } });
      if (exists) return res.status(409).json({ message: "Shift name already exists" });
    }

    await shift.update({
      name: name !== undefined ? name.trim() : shift.name,
      timeOn: timeOn !== undefined ? timeOn : shift.timeOn,
      startAt: startAt !== undefined ? startAt : shift.startAt,
      endAt: endAt !== undefined ? endAt : shift.endAt,
    });

    res.json({ shift });
  } catch (err) {
    next(err);
  }
};

/** DELETE /shifts/:id */
const deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByPk(req.params.id);
    if (!shift) return res.status(404).json({ message: "Shift not found" });

    await shift.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listShifts,
  getShiftById,
  createShift,
  updateShift,
  deleteShift,
};
