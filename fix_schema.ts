import { pool } from "./src/db/pool.js";

async function fixDB() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Drop existing messed up tables
    await client.query("DROP TABLE IF EXISTS chapter_authors CASCADE");
    await client.query("DROP TABLE IF EXISTS chapter_submissions CASCADE");

    // Recreate chapter_submissions from 006
    await client.query(`
      CREATE TABLE chapter_submissions (
        id VARCHAR(50) PRIMARY KEY,
        volume_id INT NOT NULL REFERENCES chapter_volumes(id) ON DELETE CASCADE,
        chapter_title VARCHAR(255) NOT NULL,
        abstract TEXT NOT NULL,
        keywords VARCHAR(255) NOT NULL,
        manuscript_url VARCHAR(500) NOT NULL,
        package_id INT,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        transaction_id VARCHAR(255),
        stage VARCHAR(50) DEFAULT 'Submitted',
        review_status VARCHAR(50) DEFAULT 'Pending',
        editor_assigned VARCHAR(255),
        agreed_policies BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_screenshot_url VARCHAR(500)
      );
    `);

    // Recreate chapter_authors from 006
    await client.query(`
      CREATE TABLE chapter_authors (
        id SERIAL PRIMARY KEY,
        submission_id VARCHAR(50) NOT NULL REFERENCES chapter_submissions(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        institution VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");
    console.log("Database schema fixed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error fixing DB:", err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixDB();
