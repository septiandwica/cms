const { Role } = require("../models");
const { Op } = require("sequelize");

// role yang “dilindungi” (opsional)
const PROTECTED_ROLES = new Set(["admin"]);

async function listRoles(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = (page - 1) * limit;

    const where = q ? { name: { [Op.like]: `%${q}%` } } : undefined;

    const { rows, count } = await Role.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      roles: rows,
    });
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const role = await Role.create({ name });
    return res.status(201).json({ role });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Role name already exists" });
    }
    next(err);
  }
}

async function getRoleById(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json({ role });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    // Lindungi role inti (opsional)
    if (PROTECTED_ROLES.has(role.name)) {
      return res.status(403).json({ message: "Protected role cannot be renamed" });
    }

    const raw = req.body.name;
    const name = String(raw || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    role.name = name;
    await role.save();
    res.json({ role });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Role name already exists" });
    }
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (PROTECTED_ROLES.has(role.name)) {
      return res.status(403).json({ message: "Protected role cannot be deleted" });
    }

    await role.destroy();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
};
