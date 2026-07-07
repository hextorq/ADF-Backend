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

export async function upsertContent(key: string, value: string) {
  const { rows } = await pool.query<{
    key: string;
    value: string;
    updated_at: string;
  }>(
    `INSERT INTO content_items (key, value, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()
     RETURNING key, value, updated_at`,
    [key, value]
  );
  return rows[0];
}
