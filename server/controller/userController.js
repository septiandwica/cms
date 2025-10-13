const { User, Role, Department, Location, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

/** GET /users/me */
const getMe = (req, res) => {
  const user = typeof req.user.get === "function"
    ? req.user.get({ plain: true })
    : { ...req.user };

  if (user.password) delete user.password;
  return res.json({ user });
};

/** GET /users/all */
const getAllUsers = async (req, res, next) => {
  try {
    const { q, role_id, department_id, status } = req.query;

    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;

    const where = {};
    const qTrim = (q || "").trim();
    if (qTrim) {
      where[Op.or] = [
        { name:  { [LIKE]: `%${qTrim}%` } },
        { email: { [LIKE]: `%${qTrim}%` } },
      ];
    }
    if (role_id)       where.role_id = role_id;
    if (department_id) where.department_id = department_id;
    if (status)        where.status = status;

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "location_id"],
          include: [{ model: Location, as: "location", attributes: ["id", "name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const users = rows.map(u => u.get({ plain: true }));

    return res.json({
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      users,
    });
  } catch (err) {
    return next(err);
  }
};

/** GET /users/:id */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "location_id"],
          include: [{ model: Location, as: "location", attributes: ["id", "name"] }],
        },
      ],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: user.get({ plain: true }) });
  } catch (err) {
    return next(err);
  }
};

/** GET /users/ga */


/** GET /users/department-managed */
const getUsersByManagedDepartment = async (req, res, next) => {
  try {
    const currentUser = req.user;
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    const userWithRole = await User.findByPk(currentUser.id, {
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "location_id"],
          include: [{ model: Location, as: "location", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!userWithRole || userWithRole.role?.name !== "admin_department") {
      return res.status(403).json({ message: "Forbidden: not an admin_department" });
    }

    const adminDeptId = userWithRole.department_id;
    const adminLocationId = userWithRole.department?.location_id;

    if (!adminDeptId || !adminLocationId) {
      return res.status(400).json({ message: "Admin department not linked to valid department or location" });
    }

    // pagination setup
    const page  = Math.max(parseInt(req.query.page, 10)  || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const offset = (page - 1) * limit;

    const LIKE = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
    const { q, status } = req.query;

    const where = {
      department_id: adminDeptId,
    };

    // hanya tampilkan user dengan role employee
    const employeeRole = await Role.findOne({ where: { name: "employee" } });
    if (employeeRole) where.role_id = employeeRole.id;

    const qTrim = (q || "").trim();
    if (qTrim) {
      where[Op.or] = [
        { name:  { [LIKE]: `%${qTrim}%` } },
        { email: { [LIKE]: `%${qTrim}%` } },
      ];
    }

    if (status) where.status = status;

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
      include: [
        { model: Role, as: "role", attributes: ["id", "name"] },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "location_id"],
          include: [{ model: Location, as: "location", attributes: ["id", "name"] }],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // filter berdasarkan lokasi (safety)
    const users = rows
      .filter(u => u.department?.location_id === adminLocationId)
      .map(u => u.get({ plain: true }));

    return res.json({
      managedBy: userWithRole.name,
      department: userWithRole.department?.name,
      location: userWithRole.department?.location?.name,
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
      users,
    });
  } catch (err) {
    return next(err);
  }
};





/** POST /users */
const createUser = async (req, res, next) => {
  try {
    let { nik, name, email, password, phone, role_id, department_id, status } = req.body;

    if (!nik || !name || !email || !password) {
      return res.status(400).json({ message: "nik, name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();

    let roleName = null;
    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) return res.status(400).json({ message: "Invalid role_id" });
      roleName = role.name;
    }

    // Jika role vendor_catering, department_id otomatis null
    if (roleName === "vendor_catering") {
      department_id = null;
    } else if (department_id) {
      const dept = await Department.findByPk(department_id);
      if (!dept) return res.status(400).json({ message: "Invalid department_id" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await User.create({
      nik,
      name,
      email,
      password: hashed,
      phone,
      role_id,
      department_id,
      status,
    });

    const safe = created.get({ plain: true });
    delete safe.password;

    return res.status(201).json({ message: "User created", user: safe });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err?.errors?.[0]?.path || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (role_id/department_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return next(err);
  }
};

/** PUT /users/:id */
/** PUT /users/:id */
const updateUser = async (req, res, next) => {
  try {
    const { nik, name, email, phone, status, role_id, department_id } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let roleName = null;
    if (role_id !== undefined) {
      const role = await Role.findByPk(role_id);
      if (!role) return res.status(400).json({ message: "Invalid role_id" });
      user.role_id = role_id;
      roleName = role.name;
    } else if (user.role_id) {
      const role = await Role.findByPk(user.role_id);
      roleName = role?.name;
    }

    // Jika role vendor_catering → department_id otomatis null
    if (roleName === "vendor_catering") {
      user.department_id = null;
    } else if (department_id !== undefined) {
      const dept = await Department.findByPk(department_id);
      if (!dept) return res.status(400).json({ message: "Invalid department_id" });
      user.department_id = department_id;
    }

    if (nik !== undefined)   user.nik   = String(nik).trim();
    if (name !== undefined)  user.name  = String(name).trim();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    if (phone !== undefined) user.phone = phone;
    if (status !== undefined) user.status = status;

    await user.save();

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.json({ message: "User updated successfully", user: safeUser });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err?.errors?.[0]?.path || "field";
      return res.status(409).json({ message: `${field} already in use` });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (role_id/department_id)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return next(err);
  }
};


/** DELETE /users/:id */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMe,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByManagedDepartment,
};
