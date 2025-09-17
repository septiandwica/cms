const { rateLimit } = require("express-rate-limit");

// Limiter global untuk semua endpoint /auth 
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 100, // max 100 req/menit per IP untuk /auth
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter khusus login 
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10 percobaan/15m
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10 percobaan/15m
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many register attempts, please try again later.",
  },
});

module.exports = { authLimiter, registerLimiter, loginLimiter };
