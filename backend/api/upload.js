const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const pool = require("../db");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("video"), async (req, res) => {
  try {
    const videoId = uuidv4();
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await pool.query(
      `INSERT INTO videos (id, filename, original_path)
       VALUES ($1, $2, $3)`,
      [videoId, file.originalname, file.path]
    );

    const variants = [
      { format: "mp4", profile: "480p" }
    ];

    for (const v of variants) {
      await pool.query(
        `INSERT INTO tasks (id, video_id, format, profile, state)
         VALUES ($1, $2, $3, $4, 'QUEUED')`,
        [uuidv4(), videoId, v.format, v.profile]
      );
    }

    res.json({ success: true, videoId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;
