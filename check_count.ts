import { pool } from "./src/db/pool.js";
pool.query("SELECT COUNT(*) FROM chapter_submissions")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
