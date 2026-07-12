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

export async function upsertContent(key: string, value: string, adminEmail: string) {
  const { rows } = await pool.query<{
    key: string;
    value: string;
    updated_at: string;
  }>(
    `WITH previous AS (
       SELECT value FROM content_items WHERE key = $1
     ),
     upserted AS (
       INSERT INTO content_items (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()
       RETURNING key, value, updated_at
     ),
     audit AS (
       INSERT INTO content_audit_logs (content_key, old_value, new_value, admin_email)
       SELECT upserted.key, previous.value, upserted.value, $3
       FROM upserted
       LEFT JOIN previous ON true
       WHERE previous.value IS DISTINCT FROM upserted.value
       RETURNING id
     )
     SELECT key, value, updated_at FROM upserted`,
    [key, value, adminEmail]
  );
  return rows[0];
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
