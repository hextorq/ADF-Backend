import { pool } from "./pool.js";

async function createFilesTable() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("Creating files table...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Files table created successfully.");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

createFilesTable().then(() => {
  console.log("Migration complete.");
  process.exit(0);
});
