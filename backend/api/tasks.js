const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { videoId } = req.query;

    const { rows } = await pool.query(
      `SELECT id, video_id, format, profile, state, output_path, error, created_at
       FROM tasks
       WHERE ($1::uuid IS NULL OR video_id = $1)
       ORDER BY created_at`,
      [videoId || null]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

module.exports = router;
