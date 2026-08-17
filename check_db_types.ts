import { pool } from "./src/db/pool.js";
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chapter_submissions' AND column_name IN ('id', 'call_id')")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
