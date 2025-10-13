const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const { Op } = require("sequelize");
const {
  Location,
  Shift,
  Meal_Menu,
  Meal_Tray,
  Vendor_Catering,
  sequelize,
} = require("../models");

const LIKE = () => (sequelize.getDialect() === "postgres" ? Op.iLike : Op.like);
const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
const ALLOWED_STATUS = new Set(["approved", "rejected", "pending"]);

// =================== LIST ===================
async function listMealMenus(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 15, 1),
      100
    );
    const offset = (page - 1) * limit;
    const where = {};

    const role = req.user?.role?.name;
    const userId = req.user?.id;

    // ===== Role filtering =====
    if (role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: userId },
        attributes: ["id"],
      });
      if (!vendor)
        return res.status(403).json({ message: "Vendor not registered" });
      where.vendor_catering_id = vendor.id;
    }

    if (role === "admin_department") {
      return res.status(403).json({ message: "Access denied" });
    }

    // ===== Keyword search =====
    const q = (req.query.q || "").trim();
    if (q) where.name = { [LIKE()]: `%${q}%` };

    // ===== Vendor filter =====
    if (req.query.vendor_catering_id) {
      const vid = Number(req.query.vendor_catering_id);
      if (!Number.isNaN(vid)) where.vendor_catering_id = vid;
    }

    // ===== Status filter =====
    if (req.query.status) {
      const st = String(req.query.status).trim();
      if (ALLOWED_STATUS.has(st)) where.status = st;
    }

    // ===== Date filters (FOR_DATE only) =====
    const forDate = (req.query.for_date || "").trim();
    const dateFrom = (req.query.date_from || "").trim();
    const dateTo = (req.query.date_to || "").trim();

    if (forDate) {
      if (!isDateOnly(forDate))
        return res.status(400).json({ message: "for_date must be YYYY-MM-DD" });
      where.for_date = forDate;
    } else {
      if (dateFrom && !isDateOnly(dateFrom))
        return res
          .status(400)
          .json({ message: "date_from must be YYYY-MM-DD" });
      if (dateTo && !isDateOnly(dateTo))
        return res.status(400).json({ message: "date_to must be YYYY-MM-DD" });

      if (dateFrom && dateTo)
        where.for_date = { [Op.between]: [dateFrom, dateTo] };
      else if (dateFrom) where.for_date = { [Op.gte]: dateFrom };
      else if (dateTo) where.for_date = { [Op.lte]: dateTo };
    }

    // ===== Query database =====
    const { rows, count } = await Meal_Menu.findAndCountAll({
      where,
      include: [
        { model: Meal_Tray, as: "meal_tray", attributes: ["id", "name"] },
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name", "shift_id", "location_id"],
          include: [
            { model: Shift, as: "shift", attributes: ["id", "name"] },
            { model: Location, as: "location", attributes: ["id", "name"] },
          ],
        },
      ],
      order: [
        ["for_date", "DESC"], // urut berdasarkan tanggal menu
        ["createdAt", "DESC"], // fallback jika tanggal sama
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
      meal_menus: rows.map((r) => r.get({ plain: true })),
    });
  } catch (err) {
    next(err);
  }
}

// =================== GET BY ID ===================
async function getMealMenuById(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "user_id", "name"],
        },
      ],
    });

    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    if (role === "vendor_catering" && item.vendor_catering.user_id !== userId)
      return res.status(403).json({ message: "Access denied" });

    if (role === "admin_department" || role === "employee")
      return res.status(403).json({ message: "Access denied" });

    return res.json({ meal_menu: item.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// =================== CREATE ===================
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
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // ===== Pastikan user adalah vendor catering =====
    const vendor = await Vendor_Catering.findOne({
      where: { user_id: userId },
      attributes: ["id"],
    });
    if (!vendor)
      return res
        .status(403)
        .json({ message: "You are not registered as a vendor catering" });

    // ===== Validasi field wajib =====
    if (!meal_tray_id)
      return res.status(400).json({ message: "meal_tray_id is required" });

    name = String(name || "").trim();
    for_date = String(for_date || "").trim();

    if (!name)
      return res.status(400).json({ message: "Menu name is required" });
    if (!for_date)
      return res.status(400).json({ message: "for_date is required" });
    if (!isDateOnly(for_date))
      return res
        .status(400)
        .json({ message: "for_date must be in format YYYY-MM-DD" });

    // ===== VALIDASI WAKTU PEMBUATAN MENU =====
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, ..., 6 = Saturday

    // Hanya boleh buat menu Jumat (5) - Rabu (3)
    if (day === 4) {
      // Kamis
      return res.status(400).json({
        message: "Menu can only be created from Friday to Wednesday.",
      });
    }

    // ===== Tentukan minggu target: minggu depan =====
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    // Minggu target = minggu depan (Senin–Jumat)
    const targetMonday = nextMonday;
    const targetFriday = new Date(targetMonday);
    targetFriday.setDate(targetMonday.getDate() + 4);

    const mondayStr = targetMonday.toISOString().slice(0, 10);
    const fridayStr = targetFriday.toISOString().slice(0, 10);

    // ===== Validasi bahwa for_date ada dalam minggu target =====
    if (for_date < mondayStr || for_date > fridayStr) {
      return res.status(400).json({
        message: `Invalid for_date. You can only create menus for the week ${mondayStr} to ${fridayStr}.`,
      });
    }
    // ===== VALIDASI TRAY UNIK PER HARI & SHIFT =====

// Ambil shift dari vendor (vendor_catering.shift_id)
const vendorData = await Vendor_Catering.findByPk(vendor.id, {
  attributes: ["shift_id"],
});
if (!vendorData || !vendorData.shift_id) {
  return res.status(400).json({
    message: "Vendor shift not found. Please ensure vendor has an assigned shift.",
  });
}

// Cek apakah ada menu lain dengan tray & shift sama di tanggal yang sama
const duplicateTray = await Meal_Menu.findOne({
  where: {
    vendor_catering_id: vendor.id,
    meal_tray_id,
    for_date,
  },
  include: [
    {
      model: Vendor_Catering,
      as: "vendor_catering",
      where: { shift_id: vendorData.shift_id },
    },
  ],
});

if (duplicateTray) {
  return res.status(400).json({
    message: `Tray already used for shift ${vendorData.shift_id} on ${for_date}. Please choose another tray.`,
  });
}

    // ===== Validasi status & duplikasi =====
    if (!status || req.user.role.name === "vendor_catering") status = "pending";

    const existing = await Meal_Menu.findOne({
      where: { vendor_catering_id: vendor.id, for_date, name },
    });
    if (existing)
      return res.status(409).json({ message: "Duplicate menu for this date" });

    // ===== Simpan ke database =====
    const created = await Meal_Menu.create({
      vendor_catering_id: vendor.id,
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

    return res
      .status(201)
      .json({ meal_menu: withInclude.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// =================== BULK CREATE (CSV) ===================
// =================== BULK CREATE (CSV / EXCEL) ===================
async function bulkCreateMealMenus(req, res, next) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role?.name;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (role !== "vendor_catering") {
      return res
        .status(403)
        .json({ message: "Only vendor catering can bulk upload" });
    }

    const vendor = await Vendor_Catering.findOne({
      where: { user_id: userId },
      attributes: ["id", "shift_id"],
    });
    if (!vendor) {
      return res
        .status(403)
        .json({ message: "Vendor catering not registered" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "File is required (CSV or Excel)" });
    }

    const filePath = req.file.path;
    const ext = path.extname(filePath).toLowerCase();

    let rows = [];

    // ====== CSV ======
    if (ext === ".csv") {
      rows = await new Promise((resolve, reject) => {
        const temp = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => temp.push(data))
          .on("end", () => resolve(temp))
          .on("error", reject);
      });
    }
    // ====== EXCEL ======
    else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet);
    } else {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "Invalid file format (only .csv or .xlsx allowed)" });
    }

    // === Validasi & insert ===
    const errors = [];
    const inserts = [];

    const today = new Date();
    const day = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // ❌ Tidak boleh upload pada Kamis
    if (day === 4) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "Bulk upload is only allowed from Friday to Wednesday.",
      });
    }

    // 🗓️ Tentukan minggu target (Senin–Jumat minggu depan)
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    const targetMonday = nextMonday;
    const targetFriday = new Date(targetMonday);
    targetFriday.setDate(targetMonday.getDate() + 4);

    const mondayStr = targetMonday.toISOString().slice(0, 10);
    const fridayStr = targetFriday.toISOString().slice(0, 10);

    for (const [index, row] of rows.entries()) {
      const meal_tray_id = row.meal_tray_id || row["Meal Tray ID"];
      const name = row.name || row["Name"];
      const descriptions = row.descriptions || row["Descriptions"];
      const nutrition_facts = row.nutrition_facts || row["Nutrition Facts"];
      const for_date = row.for_date || row["For Date"];

      // 🧩 1️⃣ Validasi field wajib
      if (!meal_tray_id || !name || !for_date) {
        errors.push({ line: index + 2, error: "Missing required fields" });
        continue;
      }

      // 🧩 2️⃣ Validasi format tanggal
      if (!isDateOnly(for_date)) {
        errors.push({
          line: index + 2,
          error: "Invalid date format (YYYY-MM-DD)",
        });
        continue;
      }

      // 🧩 3️⃣ Validasi tanggal dalam minggu target
      if (for_date < mondayStr || for_date > fridayStr) {
        errors.push({
          line: index + 2,
          error: `Invalid date range. Allowed week is ${mondayStr} → ${fridayStr}.`,
        });
        continue;
      }

      // 🧩 4️⃣ Validasi duplikat nama menu di tanggal sama
      const dupName = await Meal_Menu.findOne({
        where: { vendor_catering_id: vendor.id, for_date, name },
      });
      if (dupName) {
        errors.push({
          line: index + 2,
          error: "Duplicate menu name for this date",
        });
        continue;
      }

      // 🧩 5️⃣ Validasi tray unik per shift dan tanggal
      const dupTray = await Meal_Menu.findOne({
        where: { vendor_catering_id: vendor.id, meal_tray_id, for_date },
        include: [
          {
            model: Vendor_Catering,
            as: "vendor_catering",
            where: { shift_id: vendor.shift_id },
          },
        ],
      });

      if (dupTray) {
        errors.push({
          line: index + 2,
          error: `Tray already used for shift ${vendor.shift_id} on ${for_date}`,
        });
        continue;
      }

      inserts.push({
        vendor_catering_id: vendor.id,
        meal_tray_id,
        name: String(name).trim(),
        descriptions: descriptions || null,
        nutrition_facts: nutrition_facts || null,
        for_date,
        status: "pending",
      });
    }

    // Simpan yang valid
    if (inserts.length > 0) {
      await Meal_Menu.bulkCreate(inserts);
    }

    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      total_rows: rows.length,
      inserted: inserts.length,
      errors,
      allowed_week: { from: mondayStr, to: fridayStr },
    });
  } catch (err) {
    next(err);
  }
}


// =================== GET MENUS FOR NEXT WEEK ===================
async function getNextWeekMenus(req, res, next) {
  try {
    const today = new Date();

    // Cari hari Senin minggu depan
    const day = today.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const daysUntilNextMonday = (8 - day) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    // Tanggal Jumat minggu depan (Senin + 4 hari)
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    const dateFrom = nextMonday.toISOString().slice(0, 10);
    const dateTo = nextFriday.toISOString().slice(0, 10);

    const where = {
      for_date: { [Op.between]: [dateFrom, dateTo] },
    };

    // Filter role vendor (jika perlu)
    const role = req.user?.role?.name;
    const userId = req.user?.id;
    if (role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: userId },
        attributes: ["id"],
      });
      if (!vendor)
        return res.status(403).json({ message: "Vendor not registered" });
      where.vendor_catering_id = vendor.id;
    }

    const menus = await Meal_Menu.findAll({
      where,
      include: [
        { model: Meal_Tray, as: "meal_tray", attributes: ["id", "name"] },
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name"],
          include: [
            { model: Shift, as: "shift", attributes: ["id", "name"] },
            { model: Location, as: "location", attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["for_date", "ASC"]],
    });

    return res.json({
      week_range: { from: dateFrom, to: dateTo },
      total: menus.length,
      meal_menus: menus.map((r) => r.get({ plain: true })),
    });
  } catch (err) {
    next(err);
  }
}

// =================== UPDATE ===================
async function updateMealMenu(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "user_id"],
        },
      ],
    });
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    if (role === "vendor_catering") {
      if (item.vendor_catering.user_id !== userId)
        return res.status(403).json({ message: "Access denied" });
      delete req.body.status;
    }

    // ===== VALIDASI TRAY UNIK PER HARI & SHIFT (SAAT UPDATE) =====
if (role === "vendor_catering") {
  const { meal_tray_id, for_date } = req.body;

  if (meal_tray_id || for_date) {
    // ambil data vendor (termasuk shift)
    const vendor = await Vendor_Catering.findByPk(item.vendor_catering.id, {
      attributes: ["id", "shift_id"],
    });

    if (!vendor || !vendor.shift_id) {
      return res.status(400).json({
        message:
          "Vendor shift not found. Please ensure vendor has an assigned shift.",
      });
    }

    const trayId = meal_tray_id || item.meal_tray_id;
    const date = for_date || item.for_date;

    const duplicateTray = await Meal_Menu.findOne({
      where: {
        vendor_catering_id: vendor.id,
        meal_tray_id: trayId,
        for_date: date,
        id: { [Op.ne]: item.id }, // exclude current menu
      },
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          where: { shift_id: vendor.shift_id },
        },
      ],
    });

    if (duplicateTray) {
      return res.status(400).json({
        message: `Tray already used for shift ${vendor.shift_id} on ${date}. Please choose another tray.`,
      });
    }
  }
}
    if (role === "general_affair") {
      const allowed = ["status", "status_notes"];
      for (const key of Object.keys(req.body)) {
        if (!allowed.includes(key)) delete req.body[key];
      }
    }

    if (role === "admin_department" || role === "employee")
      return res.status(403).json({ message: "Access denied" });

    Object.assign(item, req.body);
    await item.save();

    const fresh = await Meal_Menu.findByPk(item.id, {
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name"],
        },
      ],
    });

    return res.json({ meal_menu: fresh.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

// =================== UPDATE STATUS ONLY ===================
async function updateMealMenuStatus(req, res, next) {
  try {
    const role = req.user?.role?.name;
    if (role !== "general_affair")
      return res
        .status(403)
        .json({ message: "Only General Affair can update status" });

    const { status, status_notes } = req.body;
    if (!status || !ALLOWED_STATUS.has(status))
      return res.status(400).json({ message: "Invalid status" });

    const item = await Meal_Menu.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    item.status = status;
    if (status_notes !== undefined) item.status_notes = status_notes;
    await item.save();

    return res.json({ success: true, status: item.status });
  } catch (err) {
    next(err);
  }
}
async function bulkUpdateMealMenuStatus(req, res, next) {
  try {
    const role = req.user?.role?.name;
    if (!["general_affair", "admin"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { ids, status, status_notes } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array is required" });
    }

    if (!status || !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update all selected rows
    const [updatedCount] = await Meal_Menu.update(
      {
        status,
        ...(status_notes !== undefined && { status_notes }),
      },
      {
        where: { id: { [Op.in]: ids } },
      }
    );

    return res.json({
      success: true,
      updated: updatedCount,
      message: `Successfully updated ${updatedCount} meal menu(s)`,
    });
  } catch (err) {
    next(err);
  }
}

// =================== DELETE ===================
async function deleteMealMenu(req, res, next) {
  try {
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    const item = await Meal_Menu.findByPk(req.params.id, {
      include: [
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "user_id"],
        },
      ],
    });
    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    if (role === "vendor_catering" && item.vendor_catering.user_id !== userId)
      return res.status(403).json({ message: "Access denied" });

    if (role === "admin_department" || role === "employee")
      return res.status(403).json({ message: "Access denied" });

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
  bulkCreateMealMenus,
  updateMealMenu,
  bulkUpdateMealMenuStatus,
  updateMealMenuStatus,
  deleteMealMenu,
  getNextWeekMenus,
};
