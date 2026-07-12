CREATE TABLE IF NOT EXISTS content_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  content_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_audit_logs_created_at
  ON content_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_audit_logs_content_key
  ON content_audit_logs (content_key);
