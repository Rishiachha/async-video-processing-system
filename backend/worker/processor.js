const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const path = require("path");
const pool = require("../db");

async function processNextTask() {
  try {
    // Get one queued task
    const { rows } = await pool.query(
      `SELECT t.*, v.original_path
       FROM tasks t
       JOIN videos v ON t.video_id = v.id
       WHERE t.state = 'QUEUED'
       ORDER BY t.created_at
       LIMIT 1`
    );

    if (rows.length === 0) {
      return;
    }

    const task = rows[0];

    // Mark task as PROCESSING
    await pool.query(
      `UPDATE tasks SET state='PROCESSING', updated_at=NOW() WHERE id=$1`,
      [task.id]
    );

    const inputPath = path.resolve(task.original_path);
    const outputFile = `${uuidv4()}-${task.profile}.${task.format}`;
    const outputPath = path.resolve("outputs", outputFile);

    // Simple FFmpeg command (simulate long-running work)
    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vf scale=640:-1 "${outputPath}"`;

    exec(ffmpegCmd, async (err) => {
      if (err) {
        console.error("FFmpeg failed:", err);

        await pool.query(
          `UPDATE tasks
           SET state='FAILED', error=$2, updated_at=NOW()
           WHERE id=$1`,
          [task.id, err.message]
        );
        return;
      }

      await pool.query(
        `UPDATE tasks
         SET state='COMPLETED', output_path=$2, updated_at=NOW()
         WHERE id=$1`,
        [task.id, outputPath]
      );

      console.log(`Task ${task.id} completed`);
    });
  } catch (err) {
    console.error("Worker error:", err);
  }
}

// Poll every 5 seconds
setInterval(processNextTask, 5000);

console.log("Worker started, waiting for tasks...");
