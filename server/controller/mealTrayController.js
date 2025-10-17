const { Meal_Tray, sequelize } = require("../models");
const { Op } = require("sequelize");

// Helper: LIKE operator sesuai dialect DB
const LIKE = () => (sequelize.getDialect() === "postgres" ? Op.iLike : Op.like);

// ---------------- LIST ----------------
/**
 * GET /meal-trays
 * Query params yang didukung:
 *   ?q=rice           -> cari by name (LIKE)
 *   &page=1&limit=25  -> pagination
 */
/**
 * GET /meal-trays
 * Query:
 *  - q (search by name)
 *  - page, limit
 */
const listMealTrays = async (req, res, next) => {
  try {
    const { q } = req.query;

    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const where = {};
    const qTrim = (q || "").trim();
    if (qTrim) {
      where[Op.or] = [
        { name: { [LIKE]: `%${qTrim}%` } },
      ];
    }

    const { rows, count } = await Meal_Tray.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const items = rows.map(r => r.get({ plain: true }));

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      meal_trays: items,
    });
  } catch (err) {
    return next(err);
  }
};

// ---------------- GET BY ID ----------------
/**
 * GET /meal-trays/:id
 */
async function getMealTrayById(req, res, next) {
  try {
    const item = await Meal_Tray.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal tray not found" });

    return res.json({ meal_tray: item.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// ---------------- CREATE ----------------
/**
 * POST /meal-trays
 * Body: { name }
 */
async function createMealTray(req, res, next) {
  try {
    let { name } = req.body;
    name = String(name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    // optional: cek duplikasi nama
    const existing = await Meal_Tray.findOne({
      where: { name },
      attributes: ["id"],
    });
    if (existing) {
      return res.status(409).json({ message: "Meal tray with this name already exists" });
    }

    const created = await Meal_Tray.create({ name });
    return res.status(201).json({ meal_tray: created.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map((e) => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    next(err);
  }
}

// ---------------- UPDATE ----------------
/**
 * PUT /meal-trays/:id
 * Body parsial: { name }
 */
async function updateMealTray(req, res, next) {
  try {
    const item = await Meal_Tray.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal tray not found" });

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ message: "name cannot be empty" });

      // cek duplikasi nama
      const dup = await Meal_Tray.findOne({
        where: {
          name,
          id: { [Op.ne]: item.id },
        },
        attributes: ["id"],
      });
      if (dup) {
        return res.status(409).json({ message: "Meal tray with this name already exists" });
      }

      item.name = name;
    }

    await item.save();

    return res.json({ meal_tray: item.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map((e) => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    next(err);
  }
}

// ---------------- DELETE ----------------
/**
 * DELETE /meal-trays/:id
 */
async function deleteMealTray(req, res, next) {
  try {
    const item = await Meal_Tray.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal tray not found" });

    await item.destroy();
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMealTrays,
  getMealTrayById,
  createMealTray,
  updateMealTray,
  deleteMealTray,
};
