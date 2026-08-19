import { pool } from "./pool.js";

async function addChapterAuthorFields() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Adding address and author_bio to chapter_authors table...");
    
    await client.query(`
      ALTER TABLE chapter_authors 
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS author_bio TEXT
    `);
    
    console.log("Columns added successfully.");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

addChapterAuthorFields().then(() => {
  console.log("Migration complete.");
  process.exit(0);
});
