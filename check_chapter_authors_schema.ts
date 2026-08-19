import { pool } from "./src/db/pool.js";
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chapter_authors'").then(res => { console.log(res.rows); process.exit(0); });
