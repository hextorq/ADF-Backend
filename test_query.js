import { pool } from "./src/db/pool.js";

async function run() {
  try {
    const result = await pool.query(`
      SELECT cs.id, cs.chapter_title, cs.stage, cs.review_status, cs.payment_status, cs.created_at, cv.title as volume_title
      FROM chapter_submissions cs
      JOIN chapter_volumes cv ON cs.volume_id = cv.id
      ORDER BY cs.created_at DESC
    `);
    console.log(result.rows);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    process.exit(0);
  }
}

run();
