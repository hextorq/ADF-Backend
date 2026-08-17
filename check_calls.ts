import { pool } from "./src/db/pool.js";
pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'chapter_calls'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
