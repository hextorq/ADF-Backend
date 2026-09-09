const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '..', '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const dbUrl = env.match(/DATABASE_URL=([^\r\n]+)/)[1];
const pool = new Pool({ connectionString: dbUrl });

async function migrate() {
  const sql = `
    ALTER TABLE manuscript_formatting_sessions ADD COLUMN IF NOT EXISTS validation_report JSONB DEFAULT '{}';
    ALTER TABLE manuscript_formatting_sessions ADD COLUMN IF NOT EXISTS publication_type VARCHAR(100) DEFAULT 'Book Chapters';
    ALTER TABLE manuscript_formatting_sessions ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
    ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS validation_report JSONB DEFAULT '{}';
    ALTER TABLE chapter_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
    ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS validation_report JSONB DEFAULT '{}';
    ALTER TABLE literary_submissions ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '';
  `;
  await pool.query(sql);
  console.log('Database schema extended successfully for ADF Formatter v2!');
  await pool.end();
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
