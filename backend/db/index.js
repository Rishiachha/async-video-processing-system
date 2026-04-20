const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "video_forge",
  password: "Rishiachha@9",
  port: 5432,
});

module.exports = pool;
