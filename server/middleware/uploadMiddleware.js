const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Buat path absolut (selalu aman di mana pun dijalankan)
const uploadDir = path.resolve(__dirname, "../uploads");

// ✅ Cek dan buat folder kalau belum ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📂 Folder 'uploads' created automatically at:", uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;
