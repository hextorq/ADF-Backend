import { pool } from "./src/db/pool.js";
pool.query("SELECT name, photo_url FROM authors")
  .then(res => { console.log(res.rows); process.exit(0); });
