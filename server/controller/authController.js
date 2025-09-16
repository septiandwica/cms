const { User } = require("../models");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

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
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const [existingEmail, existingNik] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { nik } }),
    ]);
    if (existingEmail) return res.status(400).json({ message: "Email already in use" });
    if (existingNik)   return res.status(400).json({ message: "NIK already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const created = await User.create({
      nik, name, email, password: hashedPassword, phone, role_id
    });

    const token = generateToken(created);
    res.cookie("jwt", token, cookieOpts);

    const safeUser = created.get({ plain: true });
    delete safeUser.password;

    return res.status(201).json({
      message: "User registered successfully",
      user: safeUser
    });

  } catch (err) {
    console.error("[registerUser]", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      const field = err?.errors?.[0]?.path || "field";
      return res.status(400).json({ message: `${field} already in use` });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({ message: "Invalid foreign key (e.g., role_id not found)" });
    }
    if (err.name === "SequelizeValidationError") {
      const details = err.errors?.map(e => e.message);
      return res.status(422).json({ message: "Validation error", details });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user);
    res.cookie("jwt", token, cookieOpts);

    const safeUser = user.get({ plain: true });
    delete safeUser.password;

    return res.json({ message: "Login successful", user: safeUser });

  } catch (err) {
    console.error("[loginUser]", err);
    return res.status(500).json({ message: "Internal server error" });
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


module.exports = { registerUser, loginUser, logoutUser };
