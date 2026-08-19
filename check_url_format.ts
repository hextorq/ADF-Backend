import { pool } from "./src/db/pool.js";
pool.query("SELECT payment_screenshot_url FROM chapter_submissions LIMIT 1").then(res => { console.log(res.rows); process.exit(0); });
