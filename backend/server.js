const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const uploadRoute = require("./api/upload");
const tasksRoute = require("./api/tasks");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/upload", uploadRoute);
app.use("/tasks", tasksRoute);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/download/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const { rows } = await pool.query(
      "SELECT output_path, state FROM tasks WHERE id = $1",
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (rows[0].state !== "COMPLETED") {
      return res.status(400).json({
        error: "Task not completed yet",
        state: rows[0].state,
      });
    }

    const filePath = path.resolve(rows[0].output_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Output file missing" });
    }

    res.download(filePath);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
