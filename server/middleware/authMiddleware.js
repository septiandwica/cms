const passport = require("passport");
const { User, Role, Department, Vendor_Catering, Location, Shift } = require("../models");

const isLoggedIn = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, user, info) => {
    try {
      if (err) {
        console.error("[isLoggedIn] Passport error:", err);
        return res.status(500).json({
          success: false,
          message: "Authentication error",
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Token invalid or missing.",
          detail: process.env.NODE_ENV === "development" ? info : undefined,
        });
      }

      // ✅ Re-load user lengkap dari DB dengan semua relasi
      const fullUser = await User.findByPk(user.id, {
        include: [
          { model: Role, as: "role" },
          {
            model: Department,
            as: "department",
            include: [{ model: Location, as: "location" }],
          },
          {
            model: Vendor_Catering,
            as: "vendor_catering",
            include: [
              { model: Location, as: "location" },
              { model: Shift, as: "shift" },
            ],
          },
        ],
      });

      if (!fullUser)
        return res.status(401).json({ success: false, message: "User not found" });

      req.user = fullUser;
      next();
    } catch (e) {
      console.error("[isLoggedIn] Reload error:", e);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  })(req, res, next);
};

module.exports = { isLoggedIn };
