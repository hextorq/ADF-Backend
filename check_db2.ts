import { pool } from "./src/db/pool.js";
pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'chapter_submissions'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
