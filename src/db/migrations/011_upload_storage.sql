-- Migration: Upload storage on disk
--
-- Uploaded files are now written to <backend>/uploads/<folder>/<file> by the
-- storage layer in src/lib/uploads.ts. The database only keeps the path
-- (e.g. /uploads/chapters/my-chapter-1762266000000-a1b2c3d4.docx).
--
-- This migration guarantees the legacy blob table exists so that the
-- /api/files/:id compatibility route can still serve rows that were stored
-- before the switch. It is no longer written to by application code.

CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(255) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE files IS
  'Legacy blob storage. New uploads live on disk under /uploads/<folder>/ and only their paths are stored in business tables. Run `npm run migrate:files:apply` to copy remaining rows to disk.';

-- Speed up the disk export / audit queries.
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files (created_at);
