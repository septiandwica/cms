const { Location, sequelize } = require("../models");
const { Op } = require("sequelize");

// helper: pilih operator LIKE sesuai dialek DB
const LIKE = () => (sequelize.getDialect() === "postgres" ? Op.iLike : Op.like);

// ------- LIST -------
/**
 * GET /locations
 * Query yang didukung:
 *   ?q=pulogadung           -> cari di name (LIKE)
 *   &page=1&limit=25        -> pagination
 */
async function listLocation(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};

    // search by name
    const q = (req.query.q || "").trim();
    if (q) where.name = { [LIKE()]: `%${q}%` };

    // Pagination and Filtering
    const { rows, count } = await Location.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const items = rows.map((r) => r.get({ plain: true }));

    // Respond with paginated result
    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      locations: items,
    });
  } catch (err) {
    next(err);
  }
}

async function createLocation(req, res, next) {
  try {
    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Location name is required" });
    }

    const location = await Location.create({ name });
    res.status(201).json({ location });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Location name already exists" });
    }
    next(err);
  }
}

async function getLocationById(req, res, next) {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });
    res.json({ location });
  } catch (err) {
    next(err);
  }
}

async function updateLocation(req, res, next) {
  try {
    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Location name is required" });
    }

    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });

    location.name = name;
    await location.save();
    res.json({ location });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Location name already exists" });
    }
    next(err);
  }
}

async function deleteLocation(req, res, next) {
  try {
    const location = await Location.findByPk(req.params.id);
    if (!location) return res.status(404).json({ message: "Location not found" });

    await location.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLocation,
  createLocation,
  getLocationById,
  updateLocation,
  deleteLocation,
};
