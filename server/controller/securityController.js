const IS_PROD = process.env.NODE_ENV === "production";

function issueCsrfToken(req, res) {
  const token = req.csrfToken(); // dari csrfProtection
  // Kirim token yang bisa dibaca JS (double-submit pattern)
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
  });
  res.json({ csrfToken: token });
}

module.exports = { issueCsrfToken };