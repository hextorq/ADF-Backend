import { pool } from "./src/db/pool.js";
pool.query("SELECT * FROM chapter_calls LIMIT 1")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
