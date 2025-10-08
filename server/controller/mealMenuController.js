
// Tambahkan import Meal_Tray di bagian atas
const { Location, Shift, Meal_Menu, Meal_Tray, Vendor_Catering, sequelize } = require("../models");

const { Op } = require("sequelize");

// helper: pilih operator LIKE sesuai dialek DB
const LIKE = () => (sequelize.getDialect() === "postgres" ? Op.iLike : Op.like);

// helper: validasi tanggal DATEONLY (YYYY-MM-DD)
const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());

// enum status yang diizinkan
const ALLOWED_STATUS = new Set(["approved", "rejected", "pending"]);

// ------- LIST -------
/**
 * GET /meal-menus
 * Query yang didukung:
 *   ?q=ayam                 -> cari di name (LIKE)
 *   &vendor_catering_id=1   -> filter vendor
 *   &for_date=2025-09-17    -> filter persis tanggal (DATEONLY)
 *   &date_from=2025-09-01   -> filter rentang tanggal (>=)
 *   &date_to=2025-09-30     -> filter rentang tanggal (<=)
 *   &status=approved        -> filter status (approved|rejected|pending)
 *   &page=1&limit=25        -> pagination
 */
async function listMealMenus(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;
    const where = {};

    const role = req.user?.role?.name;
    const userId = req.user?.id;

    // 🔒 Jika vendor_catering → hanya lihat menu miliknya
    if (role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: userId },
        attributes: ["id"],
      });
      if (!vendor) return res.status(403).json({ message: "Vendor not registered" });
      where.vendor_catering_id = vendor.id;
    }

    // ❌ Jika admin_department atau employee, tolak akses
    if (role === "admin_department") {
      return res.status(403).json({ message: "Access denied" });
    }

    // search by name
    const q = (req.query.q || "").trim();
    if (q) where.name = { [LIKE()]: `%${q}%` };

    // filter vendor
    if (req.query.vendor_catering_id) {
      const vid = Number(req.query.vendor_catering_id);
      if (!Number.isNaN(vid)) where.vendor_catering_id = vid;
    }

    // filter status (single)
    if (req.query.status) {
      const st = String(req.query.status).trim();
      if (ALLOWED_STATUS.has(st)) where.status = st;
    }

    // filter tanggal
    const for_date = (req.query.for_date || "").trim();
    const date_from = (req.query.date_from || "").trim();
    const date_to = (req.query.date_to || "").trim();

    if (for_date) {
      if (!isDateOnly(for_date)) {
        return res.status(400).json({ message: "for_date must be in YYYY-MM-DD format" });
      }
      where.for_date = for_date; // exact
    } else {
      if (date_from) {
        if (!isDateOnly(date_from)) {
          return res.status(400).json({ message: "date_from must be in YYYY-MM-DD format" });
        }
      }
      if (date_to) {
        if (!isDateOnly(date_to)) {
          return res.status(400).json({ message: "date_to must be in YYYY-MM-DD format" });
        }
      }
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
        {
          model: Meal_Tray, // ✅ Tambahkan ini
          as: "meal_tray",
          attributes: ["id", "name"],
        },
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name", "shift_id", "location_id"],
          include: [
            {
              model: Shift,
              as: "shift",
              attributes: ["id", "name"],
            },
            {
              model: Location,
              as: "location",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [
        ["for_date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      meal_menus: rows.map(r => r.get({ plain: true })),
    });
  } catch (err) {
    next(err);
  }
}


// ------- GET BY ID -------
/**
 * GET /meal-menus/:id
 */
async function getMealMenuById(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "user_id", "name"] }],
    });

    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    if (role === "vendor_catering") {
      if (item.vendor_catering.user_id !== userId) {
        return res.status(403).json({ message: "Access denied: not your menu" });
      }
    }

    if (role === "admin_department" || role === "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ meal_menu: item.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}
// ------- CREATE -------
/**
 * POST /meal-menus
 * Body wajib: { vendor_catering_id, name, for_date }
 * Opsional: { descriptions, nutrition_facts, status }
 */
async function createMealMenu(req, res, next) {
  try {
    let {
      meal_tray_id,
      name,
      descriptions,
      nutrition_facts,
      for_date,
      status,
    } = req.body;

    const userId = req.user?.id; // dari middleware auth

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: user not logged in" });
    }

    // 🔍 Cari vendor_catering milik user yang sedang login
    const vendor = await Vendor_Catering.findOne({
      where: { user_id: userId },
      attributes: ["id"],
    });

    if (!vendor) {
      return res.status(403).json({
        message: "You are not registered as a vendor catering",
      });
    }if (!meal_tray_id) {
  return res.status(400).json({ message: "meal_tray_id is required" });
}

    const vendor_catering_id = vendor.id; // ✅ otomatis diambil dari user login

    // Normalisasi input
    name = String(name || "").trim();
    for_date = String(for_date || "").trim();
    descriptions = descriptions ?? null;

    if (!name) return res.status(400).json({ message: "Menu name is required" });
    if (!for_date || !isDateOnly(for_date)) {
      return res.status(400).json({ message: "for_date (YYYY-MM-DD) is required and must be valid" });
    }

    // Vendor hanya boleh buat menu baru → status otomatis pending
    if (!status || req.user.role.name === "vendor_catering") {
      status = "pending";
    }

    // Cek duplikasi logis
    const existing = await Meal_Menu.findOne({
      where: { vendor_catering_id, for_date, name },
      attributes: ["id"],
    });
    if (existing) {
      return res.status(409).json({
        message: "Duplicate menu for the same vendor, date, and name",
      });
    }

    // Buat data baru
    const created = await Meal_Menu.create({
      vendor_catering_id,
      meal_tray_id,
      name,
      descriptions,
      nutrition_facts,
      for_date,
      status,
    });

    const withInclude = await Meal_Menu.findByPk(created.id, {
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.status(201).json({ meal_menu: withInclude.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}


// ------- UPDATE -------
/**
 * PUT/PATCH /meal-menus/:id
 * Body parsial: { vendor_catering_id?, name?, descriptions?, nutrition_facts?, for_date?, status? }
 */
async function updateMealMenu(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "user_id"] }],
    });
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    // 🔒 Vendor hanya boleh ubah miliknya sendiri
    if (role === "vendor_catering") {
      if (item.vendor_catering.user_id !== userId) {
        return res.status(403).json({ message: "Access denied: not your menu" });
      }
      // dan vendor tidak boleh ubah status langsung
      if (req.body.status !== undefined) {
        delete req.body.status;
      }
    }

    // 🔒 General affair hanya boleh ubah status & status_notes
    if (role === "general_affair") {
      const allowed = ["status", "status_notes"];
      for (const key of Object.keys(req.body)) {
        if (!allowed.includes(key)) delete req.body[key];
      }
    }

    // ❌ Role lain tidak boleh ubah
    if (role === "admin_department" || role === "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Apply update logic seperti sebelumnya
    Object.assign(item, req.body);
    await item.save();

    const fresh = await Meal_Menu.findByPk(item.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "name"] }],
    });

    return res.json({ meal_menu: fresh.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}
// ------- DELETE -------
/**
 * DELETE /meal-menus/:id
 */
async function deleteMealMenu(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [{ model: Vendor_Catering, as: "vendor_catering", attributes: ["id", "user_id"] }],
    });
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    if (role === "vendor_catering") {
      if (item.vendor_catering.user_id !== userId) {
        return res.status(403).json({ message: "Access denied: not your menu" });
      }
    }

    if (role === "admin_department" || role === "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

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
