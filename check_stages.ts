import { pool } from "./src/db/pool.js";
pool.query("SELECT DISTINCT stage FROM chapter_submissions").then(res => { console.log(res.rows); process.exit(0); });
