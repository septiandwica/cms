const {
  User,
  Role,
  Department,
  Location,
  Vendor_Catering,
  Shift,
} = require("../models");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");
const { ROLES } = require("../middleware/roleMiddleware");

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, //  7 hari
};

const registerUser = async (req, res) => {
  try {
    const { nik, name, email, password, phone, role_id } = req.body;
    const confirmPassword =
      req.body.confirmPassword ??
      req.body.password_confirmation ??
      req.body.confirm_password;

    if (!nik || !name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const [existingEmail, existingNik] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { nik } }),
    ]);
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use" });
    if (existingNik)
      return res.status(400).json({ message: "NIK already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await User.create({
      nik,
      name,
      email,
      password: hashedPassword,
      phone,
      role_id,
    });

    const token = generateToken(created);
    res.cookie("jwt", token, cookieOpts);

    const safeUser = created.get({ plain: true });
    delete safeUser.password;

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("[registerUser]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    // 🔍 Cari user berdasarkan email
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
        {
          model: Department,
          as: "department",
          attributes: ["id", "name", "location_id"],
          include: [
            {
              model: Location,
              as: "location",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Vendor_Catering,
          as: "vendor_catering",
          attributes: ["id", "name", "shift_id", "location_id"],
          include: [
            { model: Shift, as: "shift", attributes: ["id", "name"] },
            { model: Location, as: "location", attributes: ["id", "name"] },
          ],
          required: false,
        },
      ],
    });

    // ❌ User tidak ditemukan
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // ❌ Password salah
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    // 🔒 Cek status user setelah berhasil login
    if (user.status === "inactive") {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact HR or General Affair.",
      });
    }

    if (["suspend", "suspended"].includes(user.status)) {
      return res.status(403).json({
        message:
          "Your account is suspended due to SOP violations. Please contact General Affair.",
      });
    }

    // ✅ Lolos semua cek — generate token
    const token = generateToken(user);
    res.cookie("jwt", token, cookieOpts);

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("[loginUser]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * PATCH /users/:id/password
 * Body: { oldPassword, newPassword }
 * Admin bisa ganti tanpa oldPassword (opsional—ubah sesuai kebijakanmu).
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.params;

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isSelf = String(req.user.id) === String(id);
    const isAdmin = req.user.roleName === ROLES.ADMIN;

    // Jika bukan admin, wajib verifikasi oldPassword
    if (!isAdmin) {
      if (!isSelf) return res.status(403).json({ message: "Forbidden" });
      if (!oldPassword)
        return res.status(400).json({ message: "oldPassword is required" });
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match)
        return res.status(401).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: "Password updated" });
  } catch (err) {
    return next(err);
  }
};
const logoutUser = async (_req, res) => {
  // Hapus cookie di browser
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  return res.json({ message: "Logged out" });
};

module.exports = { registerUser, loginUser, changePassword, logoutUser };
