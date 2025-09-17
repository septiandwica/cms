const csrf = require("csurf");

const IS_PROD = process.env.NODE_ENV === "production";

const csrfProtection = csrf({
  cookie: {
    key: "_csrf",          // cookie rahasia (HttpOnly) untuk server verifikasi token
    httpOnly: true,
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
  },
});

// Hanya terapkan CSRF ke method yang mengubah state
function requireCsrfOnUnsafeMethods(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return csrfProtection(req, res, next);
}

module.exports = {
  csrfProtection,              // bisa dipakai untuk /csrf-token
  requireCsrfOnUnsafeMethods,  // dipakai global setelah routes public
};
