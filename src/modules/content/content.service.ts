import { pool } from "../../db/pool.js";

export async function getAllContent(): Promise<Record<string, string>> {
  const { rows } = await pool.query<{ key: string; value: string }>(
    "SELECT key, value FROM content_items"
  );
  const items: Record<string, string> = {};
  for (const row of rows) {
    items[row.key] = row.value;
  }
  return items;
}

export interface ContentAuditLog {
  id: string;
  content_key: string;
  old_value: string | null;
  new_value: string;
  admin_email: string;
  created_at: string;
}

interface UpsertContentResult {
  key: string;
  value: string;
  updated_at: string;
  old_value: string | null;
}

export async function upsertContent(key: string, value: string): Promise<UpsertContentResult> {
  const { rows } = await pool.query<{
    key: string;
    value: string;
    updated_at: string;
    old_value: string | null;
  }>(
    `WITH previous AS (
       SELECT value FROM content_items WHERE key = $1
     ),
     upserted AS (
       INSERT INTO content_items (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()
       RETURNING key, value, updated_at
     )
     SELECT upserted.key, upserted.value, upserted.updated_at, previous.value AS old_value
     FROM upserted
     LEFT JOIN previous ON true`,
    [key, value]
  );
  return rows[0];
}

export async function recordContentAuditLog(
  key: string,
  oldValue: string | null,
  newValue: string,
  adminEmail: string
) {
  if (oldValue === newValue) return;
  await pool.query(
    `INSERT INTO content_audit_logs (content_key, old_value, new_value, admin_email)
     VALUES ($1, $2, $3, $4)`,
    [key, oldValue, newValue, adminEmail]
  );
}

export async function getRecentContentEdits(limit = 20): Promise<ContentAuditLog[]> {
  const { rows } = await pool.query<ContentAuditLog>(
    `SELECT id, content_key, old_value, new_value, admin_email, created_at
     FROM content_audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}
