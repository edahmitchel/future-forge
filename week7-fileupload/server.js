const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const dotenv = require("dotenv");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const PORT = process.env.PORT || 3001;
const TMP_DIR = process.env.TMP_UPLOAD_DIR || "tmp";
const PUBLIC_UPLOADS = process.env.PUBLIC_UPLOAD_DIR || "public/uploads";

// ensure directories exist
fs.mkdirSync(TMP_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_UPLOADS, { recursive: true });

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TMP_DIR);
  },
  filename: function (req, file, cb) {
    // keep original name but prefix with timestamp
    const fname = `${Date.now()}-${file.originalname}`;
    cb(null, fname);
  },
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());

// serve static files from public
app.use(express.static(path.join(__dirname, "public")));

// simple health
app.get("/health", (req, res) => res.json({ ok: true }));

// Upload and save locally to public/uploadsserver.js
app.post("/upload-local", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const tmpPath = req.file.path;
    const destPath = path.join(PUBLIC_UPLOADS, req.file.filename);

    // move file from tmp -> public/uploads
    fs.rename(tmpPath, destPath, (err) => {
      if (err)
        return res.status(500).json({ success: false, message: err.message });

      // file is now served at /uploads/<filename> (public is static root)
      const publicUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({ success: true, url: publicUrl });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload to Cloudinary
app.post("/upload-cloudinary", upload.single("file"), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const localPath = req.file.path;

    cloudinary.uploader.upload(
      localPath,
      { folder: "upload-demo" },
      (error, result) => {
        // remove local tmp file
        fs.unlink(localPath, () => {});

        if (error)
          return res
            .status(500)
            .json({ success: false, message: error.message });

        // result.secure_url is the hosted file
        console.log(result);
        res
          .status(201)
          .json({ success: true, url: result.secure_url, raw: result });
      },
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Upload demo server listening on http://localhost:${PORT}`);
});
