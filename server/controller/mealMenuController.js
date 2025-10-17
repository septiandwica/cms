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
  Department,
  Vendor_Catering,
  sequelize,
} = require("../models");
const moment = require("moment");

const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
const ALLOWED_STATUS = new Set(["approved", "revisi", "pending", "resubmit"]);

async function listMealMenus(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 15, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    const { Op } = require("sequelize");
    const role = req.user?.role?.name?.toLowerCase();
    const userId = req.user?.id;

    // ===== Role-based filtering =====
    if (role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: userId },
        attributes: ["id", "location_id"],
      });
      if (!vendor)
        return res.status(403).json({ message: "Vendor not registered" });

      where.vendor_catering_id = vendor.id;
      where["$vendor_catering.location_id$"] = vendor.location_id;
    } 
    else if (["general_affair", "admin_department"].includes(role)) {
      const dept = await Department.findOne({
        where: { id: req.user.department_id },
        attributes: ["id", "location_id"],
      });
      if (!dept)
        return res.status(403).json({ message: "Department not found" });

      where["$vendor_catering.location_id$"] = dept.location_id;
    } 
    else if (role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // ===== Keyword search =====
    const q = (req.query.q || "").trim();
   if (q) where.name = { [Op.iLike]: `%${q}%` };
   if (q) where.name = { [LIKE]: `%${q}%` };

    // ===== Filter: Vendor =====
    if (req.query.vendor_catering_id) {
      const vid = Number(req.query.vendor_catering_id);
      if (!Number.isNaN(vid)) where.vendor_catering_id = vid;
    }

    // ===== Filter: Location =====
    if (req.query.location_id) {
      const lid = Number(req.query.location_id);
      if (!Number.isNaN(lid))
        where["$vendor_catering.location_id$"] = lid;
    }

    // ===== Filter: Shift =====
    if (req.query.shift_id) {
      const sid = Number(req.query.shift_id);
      if (!Number.isNaN(sid))
        where["$vendor_catering.shift_id$"] = sid;
    }

    // ===== Filter: Status =====
    if (req.query.status) {
      const st = String(req.query.status).trim().toLowerCase();
      const allowed = new Set(["pending", "approved", "revisi"]);
      if (allowed.has(st)) where.status = st;
    }

    // ===== Filter: Date range =====
    const forDate = (req.query.for_date || "").trim();
    const dateFrom = (req.query.date_from || "").trim();
    const dateTo = (req.query.date_to || "").trim();

    // ===== Filter: next week (auto) =====
    if (req.query.next_week === "true") {
      const nextMonday = moment().isoWeekday(8);
      const nextFriday = nextMonday.clone().add(4, "days");
      where.for_date = {
        [Op.between]: [
          nextMonday.format("YYYY-MM-DD"),
          nextFriday.format("YYYY-MM-DD"),
        ],
      };
    } else if (forDate) {
      if (!moment(forDate, "YYYY-MM-DD", true).isValid())
        return res.status(400).json({ message: "for_date must be YYYY-MM-DD" });

      where.for_date = forDate;
    } else if (dateFrom || dateTo) {
      if (dateFrom && !moment(dateFrom, "YYYY-MM-DD", true).isValid())
        return res.status(400).json({ message: "date_from must be YYYY-MM-DD" });
      if (dateTo && !moment(dateTo, "YYYY-MM-DD", true).isValid())
        return res.status(400).json({ message: "date_to must be YYYY-MM-DD" });

      if (dateFrom && dateTo) {
        where.for_date = {
          [Op.between]: [
            moment(dateFrom).format("YYYY-MM-DD"),
            moment(dateTo).format("YYYY-MM-DD"),
          ],
        };
      } else if (dateFrom) {
        where.for_date = { [Op.gte]: moment(dateFrom).format("YYYY-MM-DD") };
      } else if (dateTo) {
        where.for_date = { [Op.lte]: moment(dateTo).format("YYYY-MM-DD") };
      }
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
      meal_menus: rows.map((r) => r.get({ plain: true })),
    });
  } catch (err) {
    console.error("❌ Error in listMealMenus:", err);
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
    const userId = req.user?.id;
    const role = req.user?.role?.name;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (role !== "vendor_catering") {
      return res
        .status(403)
        .json({ message: "Only vendor catering can create menus" });
    }
    const vendor = await Vendor_Catering.findOne({
      where: { user_id: userId },
      attributes: ["id", "shift_id"],
    });
    if (!vendor)
      return res
        .status(403)
        .json({ message: "You are not registered as a vendor catering" });

    // Ambil field dari body
    let {
      meal_tray_id,
      name,
      descriptions,
      nutrition_facts,
      for_date,
      status,
    } = req.body;

    // Validasi dasar
    if (!meal_tray_id)
      return res.status(400).json({ message: "meal_tray_id is required" });
    if (!name)
      return res.status(400).json({ message: "Menu name is required" });
    if (!for_date)
      return res.status(400).json({ message: "for_date is required" });

    // Format tanggal valid
    if (!moment(for_date, "YYYY-MM-DD", true).isValid()) {
      return res
        .status(400)
        .json({ message: "for_date must be in YYYY-MM-DD format" });
    }

    // ✅ Gunakan waktu lokal WIB
    const today = moment().tz("Asia/Jakarta");
    const day = today.isoWeekday(); // Senin=1, Minggu=7

    // ✅ Hanya boleh buat menu Jumat (5) – Rabu (3)
    const allowedDays = [5, 6, 7, 1, 2, 3]; // Fri–Wed (moment isoWeekday)
    if (!allowedDays.includes(day)) {
      return res.status(400).json({
        message:
          "Menu can only be created from Friday to Wednesday for next week's schedule.",
      });
    }

    // ✅ Hitung minggu depan (Senin–Jumat)
    const nextMonday = today.clone().isoWeekday(8); // Senin minggu depan
    const nextFriday = nextMonday.clone().add(4, "days"); // Jumat minggu depan

    const mondayStr = nextMonday.format("YYYY-MM-DD");
    const fridayStr = nextFriday.format("YYYY-MM-DD");

    // ✅ for_date harus di antara Senin–Jumat minggu depan
    if (
      !moment(for_date).isBetween(mondayStr, fridayStr, null, "[]") // inclusive
    ) {
      return res.status(400).json({
        message: `Invalid for_date. You can only create menus for next week (${mondayStr} → ${fridayStr}).`,
      });
    }

    // ✅ Pastikan vendor punya shift
    if (!vendor.shift_id) {
      return res.status(400).json({
        message:
          "Vendor shift not found. Please ensure vendor has an assigned shift.",
      });
    }

    // ✅ Validasi tray unik per shift & tanggal
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
          where: { shift_id: vendor.shift_id },
        },
      ],
    });
    if (duplicateTray) {
      return res.status(400).json({
        message: `Tray already used for shift ${vendor.shift_id} on ${for_date}. Please choose another tray.`,
      });
    }

    // ✅ Cek duplikasi nama menu di tanggal sama
    const existing = await Meal_Menu.findOne({
      where: { vendor_catering_id: vendor.id, for_date, name },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Duplicate menu name for this date" });
    }

    // ✅ Simpan menu
    const created = await Meal_Menu.create({
      vendor_catering_id: vendor.id,
      meal_tray_id,
      name: name.trim(),
      descriptions,
      nutrition_facts,
      for_date,
      status:
        role === "vendor_catering"
          ? "pending"
          : status && ["approved", "revisi", "pending"].includes(status)
          ? status
          : "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Meal menu created successfully",
      meal_menu: created,
      allowed_week: { from: mondayStr, to: fridayStr },
    });
  } catch (err) {
    next(err);
  }
}

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
    if (!vendor)
      return res.status(403).json({ message: "Vendor catering not registered" });

    if (!req.file) {
      return res.status(400).json({ message: "File is required (CSV or Excel)" });
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

    const today = moment();
    const day = today.isoWeekday(); // 1=Senin, ..., 7=Minggu

    // ❌ Tidak boleh upload pada Kamis
    if (day === 4) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "Bulk upload is only allowed from Friday to Wednesday.",
      });
    }

    // 🗓️ Tentukan minggu target (Senin–Jumat minggu depan)
    const nextMonday = moment().isoWeekday(8); // Senin minggu depan
    const nextFriday = moment(nextMonday).add(4, "days");

    const mondayStr = nextMonday.format("YYYY-MM-DD");
    const fridayStr = nextFriday.format("YYYY-MM-DD");

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
      if (!moment(for_date, "YYYY-MM-DD", true).isValid()) {
        errors.push({
          line: index + 2,
          error: "Invalid date format (YYYY-MM-DD)",
        });
        continue;
      }

      // 🧩 3️⃣ Validasi tanggal dalam minggu target
      if (
        moment(for_date).isBefore(nextMonday, "day") ||
        moment(for_date).isAfter(nextFriday, "day")
      ) {
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
    const today = moment();

    // Cari hari Senin minggu depan
    const nextMonday = moment(today).isoWeekday(8);
    const nextFriday = moment(nextMonday).add(4, "days");

    const dateFrom = nextMonday.format("YYYY-MM-DD");
    const dateTo = nextFriday.format("YYYY-MM-DD");

    const where = {
      for_date: { [Op.between]: [dateFrom, dateTo] },
    };

    // Ambil shift_id dari query (misal ?shift_id=2)
    const shiftId = req.query.shift_id ? parseInt(req.query.shift_id, 10) : null;

    // 🔍 Jika ada shift_id, cari vendor_catering yang punya shift_id itu
    if (shiftId) {
      const vendorIds = await Vendor_Catering.findAll({
        where: { shift_id: shiftId },
        attributes: ["id"],
      });

      if (vendorIds.length === 0) {
        return res.json({
          week_range: { from: dateFrom, to: dateTo },
          total: 0,
          meal_menus: [],
        });
      }

      where.vendor_catering_id = {
        [Op.in]: vendorIds.map((v) => v.id),
      };
    }

    // Filter role vendor_catering (jika perlu)
    const role = req.user?.role?.name;
    const userId = req.user?.id;

    if (role === "vendor_catering") {
      const vendor = await Vendor_Catering.findOne({
        where: { user_id: userId },
        attributes: ["id"],
      });

      if (!vendor) {
        return res.status(403).json({ message: "Vendor not registered" });
      }

      where.vendor_catering_id = vendor.id;
    }

    const menus = await Meal_Menu.findAll({
      where,
      include: [
        { model: Meal_Tray, as: "meal_tray", attributes: ["id", "name"] },
      ],
      attributes: { exclude: ["vendor_catering_id"] },
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



async function listForSpareGA(req, res, next) {
  try {
    const { for_date, shift_id, location_id } = req.query;

    // 🧤 Validasi parameter wajib
    if (!for_date || !shift_id) {
      return res.status(400).json({
        message: "for_date and shift_id are required parameters.",
      });
    }

    // 🧩 Pastikan tanggal valid format YYYY-MM-DD
    const parsedDate = moment(for_date, "YYYY-MM-DD", true);
    if (!parsedDate.isValid()) {
      return res.status(400).json({ message: "Invalid date format (YYYY-MM-DD expected)." });
    }

    // 🔍 Filter dasar
    const where = {
      status: "approved",
      for_date: parsedDate.format("YYYY-MM-DD"),
      shift_id: parseInt(shift_id, 10),
    };

    // 🔒 Filter lokasi jika user GA punya lokasi tertentu
    const role = req.user?.role?.name;
    if (role === "general_affair" && req.user?.department?.location_id) {
      where.location_id = req.user.department.location_id;
    }

    // 📋 Ambil menu sesuai tanggal dan shift
    const menus = await Meal_Menu.findAll({
      where,
      include: [
        { model: Meal_Tray, as: "meal_tray", attributes: ["id", "name"] },
        { model: Shift, as: "shift", attributes: ["id", "name"] },
        {
          model: Vendor_Catering,
          as: "vendor",
          attributes: ["id", "name"],
          include: [
            { model: Location, as: "location", attributes: ["id", "name"] },
          ],
        },
      ],
      order: [["for_date", "ASC"]],
    });

    // 🟡 Jika tidak ada hasil
    if (!menus.length) {
      return res.status(404).json({
        message: `No approved meal menus found for ${for_date} (Shift ${shift_id}).`,
        total: 0,
        meal_menus: [],
      });
    }

    // ✅ Response sukses
    res.json({
      total: menus.length,
      meal_menus: menus.map((m) => ({
        id: m.id,
        name: m.name,
        descriptions: m.descriptions,
        for_date: m.for_date,
        shift_id: m.shift_id,
        shift_name: m.shift?.name,
        vendor_name: m.vendor?.name,
        location_name: m.vendor?.location?.name,
        meal_tray_name: m.meal_tray?.name,
      })),
    });
  } catch (err) {
    console.error("🔥 Error in listForSpareGA:", err);
    res.status(500).json({ message: "Internal server error" });
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
          attributes: ["id", "user_id", "shift_id"],
        },
      ],
    });

    if (!item) return res.status(404).json({ message: "Meal menu not found" });

    // ===== ROLE: VENDOR CATERING =====
    if (role === "vendor_catering") {
      if (item.vendor_catering.user_id !== userId)
        return res.status(403).json({ message: "Access denied" });

      // 🔒 Tidak boleh ubah status atau catatan secara manual
      delete req.body.status;
      delete req.body.status_notes;

      // 🔒 Hanya bisa edit kalau status saat ini 'revisi'
      if (!["revisi"].includes(item.status)) {
        return res.status(400).json({
          message: `You can only edit menus with status 'revisi'. Current status is '${item.status}'.`,
        });
      }

      // 🔁 Jika menu revisi diedit → ubah otomatis ke resubmit
      item.status = "resubmit";

      // VALIDASI TRAY UNIK PER SHIFT & TANGGAL
      const { meal_tray_id, for_date } = req.body;

      if (meal_tray_id || for_date) {
        const vendor = item.vendor_catering;
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
            id: { [Op.ne]: item.id },
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

    // ===== ROLE: GENERAL AFFAIR =====
    else if (role === "general_affair") {
      const allowed = ["status", "status_notes"];
      for (const key of Object.keys(req.body)) {
        if (!allowed.includes(key)) delete req.body[key];
      }
    }

    // ===== ROLE: ADMIN =====
    else if (role === "admin") {
      // Admin bebas edit semua
    } else {
      // Role lain tidak boleh
      return res.status(403).json({ message: "Access denied" });
    }

    // APPLY UPDATE
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
  listForSpareGA
};
