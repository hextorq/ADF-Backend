import { pool } from "./src/db/pool.js";
pool.query("ALTER TABLE chapter_volumes ADD COLUMN pdf_url VARCHAR(255)").then(res => { console.log("Added pdf_url column"); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
