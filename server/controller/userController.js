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

module.exports = { getMe, getAllUsers };
