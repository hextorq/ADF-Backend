import { pool } from "./src/db/pool.js";

async function run() {
  try {
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'chapter_calls'
    `);
    console.log(result.rows);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    process.exit(0);
  }
}

run();
