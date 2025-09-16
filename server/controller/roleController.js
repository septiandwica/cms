const { Role } = require("../models");

async function listRoles(req, res, next) {
  try {
    const roles = await Role.findAll();
    res.json({ roles });
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }
    const role = await Role.create({ name: name.trim() });
    res.status(201).json({ role });
  } catch (err) {
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
    const { name } = req.body;
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    role.name = name.trim();
    await role.save();
    res.json({ role });
  } catch (err) {
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

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
