const { User, Role } = require("../models");

/**
 * GET /users/me
 * Mengembalikan profil user yang sedang login.
 */
const getMe = (req, res) => {
  // isLoggedIn sudah memastikan req.user ada
  const user = typeof req.user.get === "function"
    ? req.user.get({ plain: true })
    : { ...req.user };

  if (user.password) delete user.password;

  // Kalau passport include Role: angkat nama role jadi properti praktis
  if (!user.roleName && user.role?.name) user.roleName = user.role.name;

  return res.json({ user });
};

/**
 * GET /users/all
 * Hanya admin (cek di route via requireRoles).
 * Kembalikan daftar user tanpa field sensitif.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    // (opsional) normalisasi roleName agar gampang dipakai di FE
    const data = users.map(u => {
      const plain = u.get({ plain: true });
      if (plain.role?.name) plain.roleName = plain.role.name;
      return plain;
    });

    return res.json({ users: data });
  } catch (err) {
    return next(err); // serahkan ke global error handler
  }
};

const updateUser = async (req, res, next) => {  
  try {
    const userId = req.params.id;
    const { name, email, phone, status, role_id, department_id } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields jika ada di body
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (status !== undefined) user.status = status;
    if (role_id !== undefined) user.role_id = role_id;
    if (department_id !== undefined) user.department_id = department_id;

    await user.save();

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.json({ message: "User updated successfully", user: safeUser });

  } catch (err) {
    console.error("[updateUser]", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (e.g., role_id not found)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return next(err); // serahkan ke global error handler
  }
}

module.exports = { getMe, getAllUsers };
