// controller/mealMenuController.js
const { Meal_Menu, Vendor_Catering, sequelize } = require("../models");
const { Op } = require("sequelize");

// helper: pilih operator LIKE sesuai dialek DB
const LIKE = () =>
  sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

/**
 * GET /meal-menus
 * Query yang didukung:
 *   ?q=ayam                 -> cari di name (LIKE)
 *   &vendor_catering_id=1   -> filter vendor
 *   &for_date=2025-09-17    -> filter persis tanggal
 *   &date_from=2025-09-01   -> filter rentang tanggal (>=)
 *   &date_to=2025-09-30     -> filter rentang tanggal (<=)
 *   &page=1&limit=25        -> pagination
 */
async function listMealMenus(req, res, next) {
  try {
    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};

    const q = (req.query.q || "").trim();
    if (q) where.name = { [LIKE()]: `%${q}%` };

    if (req.query.vendor_catering_id) {
      where.vendor_catering_id = req.query.vendor_catering_id;
    }

    // filter tanggal
    const for_date = (req.query.for_date || "").trim();
    const date_from = (req.query.date_from || "").trim();
    const date_to = (req.query.date_to || "").trim();

    if (for_date) {
      where.for_date = for_date; // DATEONLY exact
    } else {
      if (date_from && date_to) {
        where.for_date = { [Op.between]: [date_from, date_to] };
      } else if (date_from) {
        where.for_date = { [Op.gte]: date_from };
      } else if (date_to) {
        where.for_date = { [Op.lte]: date_to };
      }
    }

    const { rows, count } = await Meal_Menu.findAndCountAll({
      where,
      include: [
        { model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "name"] },
      ],
      order: [
        ["for_date", "DESC"],
        ["createdAt", "DESC"],
      ],
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
      meal_menus: items,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /meal-menus/:id
 */
async function getMealMenuById(req, res, next) {
  try {
    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [
        { model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "name"] },
      ],
    });
    if (!item) return res.status(404).json({ message: "Meal menu not found" });
    return res.json({ meal_menu: item.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /meal-menus
 * Body wajib: { vendor_catering_id, name, for_date }
 * Opsional: { nutrition_facts }
 */
async function createMealMenu(req, res, next) {
  try {
    let { vendor_catering_id, name, nutrition_facts, for_date } = req.body;

    // validasi dasar
    name = String(name || "").trim();
    for_date = String(for_date || "").trim();

    if (!vendor_catering_id) {
      return res.status(400).json({ message: "vendor_catering_id is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Menu name is required" });
    }
    if (!for_date) {
      return res.status(400).json({ message: "for_date (YYYY-MM-DD) is required" });
    }

    // (opsional) bisa cek keberadaan vendor lebih dulu jika ingin pesan error lebih ramah:
    // const vendor = await Vendor_Catering.findByPk(vendor_catering_id);
    // if (!vendor) return res.status(400).json({ message: "Invalid vendor_catering_id" });

    const created = await Meal_Menu.create({
      vendor_catering_id,
      name,
      nutrition_facts,
      for_date,
    });

    // ambil ulang dengan include vendor
    const withInclude = await Meal_Menu.findByPk(created.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "name"] }],
    });

    return res.status(201).json({ meal_menu: withInclude.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      // unik: (vendor_catering_id, for_date, name)
      return res.status(409).json({ message: "Duplicate menu for the same vendor, date, and name" });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (vendor_catering_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    next(err);
  }
}

/**
 * PUT /meal-menus/:id
 * Body boleh parsial: { vendor_catering_id?, name?, nutrition_facts?, for_date? }
 * Constraint unik tetap berlaku.
 */
async function updateMealMenu(req, res, next) {
  try {
    const item = await Meal_Menu.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    const payload = {};
    if (req.body.vendor_catering_id !== undefined) {
      payload.vendor_catering_id = req.body.vendor_catering_id;
    }
    if (req.body.name !== undefined) {
      const nm = String(req.body.name || "").trim();
      if (!nm) return res.status(400).json({ message: "Menu name cannot be empty" });
      payload.name = nm;
    }
    if (req.body.nutrition_facts !== undefined) {
      payload.nutrition_facts = req.body.nutrition_facts;
    }
    if (req.body.for_date !== undefined) {
      const fd = String(req.body.for_date || "").trim();
      if (!fd) return res.status(400).json({ message: "for_date cannot be empty" });
      payload.for_date = fd;
    }

    // assign dan simpan
    Object.assign(item, payload);
    await item.save();

    const fresh = await Meal_Menu.findByPk(item.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "name"] }],
    });

    return res.json({ meal_menu: fresh.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Duplicate menu for the same vendor, date, and name" });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (vendor_catering_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    next(err);
  }
}

/**
 * DELETE /meal-menus/:id
 */
async function deleteMealMenu(req, res, next) {
  try {
    const item = await Meal_Menu.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    await item.destroy();
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMealMenus,
  getMealMenuById,
  createMealMenu,
  updateMealMenu,
  deleteMealMenu,
};
