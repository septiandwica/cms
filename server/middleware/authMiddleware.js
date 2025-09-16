const passport = require("passport");

const isLoggedIn = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
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

    // Simpan object user dari DB ke request
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = { isLoggedIn };
