const { Department, Location, User, sequelize } = require("../models");
const { Op } = require("sequelize");

async function listDepartment(req, res, next) {
  try {
    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const where = {};
    const q = (req.query.q || "").trim();
    if (q) where.name = { [LIKE]: `%${q}%` };
    if (req.query.location_id) where.location_id = req.query.location_id;

    const { rows, count } = await Department.findAndCountAll({
      where,
      include: [
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: User, as: "users", attributes: { exclude: ["password"] } },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true, // penting agar count akurat saat ada JOIN
    });

    const departments = rows.map(d => d.get({ plain: true }));

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      departments,
    });
  } catch (err) {
    next(err);
  }
}

async function getDepartmentById(req, res, next) {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: User, as: "users", attributes: { exclude: ["password"] } },
      ],
    });
    if (!department) return res.status(404).json({ message: "Department not found" });
    res.json({ department: department.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, location_id } = req.body;

    const trimmed = String(name || "").trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Department name is required" });
    }
    if (location_id == null || location_id === "") {
      return res.status(400).json({ message: "location_id is required" });
    }

    const location = await Location.findByPk(location_id);
    if (!location) {
      return res.status(400).json({ message: "Location not found (invalid location_id)" });
    }

    const department = await Department.create({ name: trimmed, location_id });

    const withInclude = await Department.findByPk(department.id, {
      include: [
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: User, as: "users", attributes: { exclude: ["password"] } },
      ],
    });

    res.status(201).json({ department: withInclude.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Department name already exists" });
    }
    next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { name, location_id } = req.body;

    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    if (name != null) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: "Department name cannot be empty" });
      department.name = trimmed;
    }

    if (location_id != null && location_id !== "") {
      const location = await Location.findByPk(location_id);
      if (!location) {
        return res.status(400).json({ message: "Location not found (invalid location_id)" });
      }
      department.location_id = location_id;
    }

    await department.save();

    const fresh = await Department.findByPk(department.id, {
      include: [
        { model: Location, as: "location", attributes: ["id", "name"] },
        { model: User, as: "users", attributes: { exclude: ["password"] } },
      ],
    });

    res.json({ department: fresh.get({ plain: true }) });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Department name already exists" });
    }
    next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ message: "Department not found" });

    await department.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDepartment,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
