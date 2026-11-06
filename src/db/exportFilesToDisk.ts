/**
 * Moves files that were stored as blobs in the `files` table onto disk.
 *
 *   uploads/<folder>/<id>                     <- written from the blob
 *   .../api/files/<id>  ->  /uploads/<folder>/<id>   <- rewritten in every
 *                                                       column that stores it
 *
 * The `files` table is left untouched (kept as a backup / legacy source).
 *
 * Usage:
 *   npm run migrate:files          # dry run, prints what would happen
 *   npm run migrate:files:apply    # writes files and updates the database
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";
import { UPLOADS_ROOT, folderForLegacyFilename, type UploadFolder } from "../lib/uploads.js";

const APPLY = process.argv.includes("--apply");

/**
 * Columns that may contain a stored file path.
 * Kept explicit so a typo cannot rewrite an unrelated column.
 */
const REFERENCES: Array<{ table: string; columns: string[] }> = [
  { table: "literary_submissions", columns: ["manuscript_url", "cover_url", "author_photo_url", "formatted_manuscript_url"] },
  { table: "chapter_submissions", columns: ["manuscript_url", "payment_screenshot_url", "formatted_manuscript_url"] },
  { table: "chapter_volumes", columns: ["cover_url", "pdf_url"] },
  { table: "manuscript_formatting_sessions", columns: ["original_file_url", "formatted_file_url"] },
  { table: "books", columns: ["cover_url", "preview_url", "pdf_url"] },
  { table: "authors", columns: ["photo_url"] },
  { table: "content_items", columns: ["value"] },
];

interface BlobRow {
  id: string;
  filename: string;
  mimetype: string;
  data: Buffer;
}

async function rewriteReferences(oldUrl: string, newUrl: string): Promise<number> {
  let touched = 0;

  for (const { table, columns } of REFERENCES) {
    for (const column of columns) {
      const result = await pool.query(
        `UPDATE ${table}
            SET ${column} = replace(${column}, $1, $2)
          WHERE ${column} LIKE '%' || $1 || '%'`,
        [oldUrl, newUrl]
      );
      if (result.rowCount && result.rowCount > 0) {
        console.log(`    ${table}.${column}: ${result.rowCount} row(s)`);
        touched += result.rowCount;
      }
    }
  }

  return touched;
}

async function main() {
  console.log(`File storage export ${APPLY ? "(APPLY)" : "(dry run)"}`);
  console.log(`Uploads root: ${UPLOADS_ROOT}\n`);

  const { rows } = await pool.query<BlobRow>(
    "SELECT id, filename, mimetype, data FROM files ORDER BY created_at ASC"
  );

  if (rows.length === 0) {
    console.log("No rows in the files table. Nothing to export.");
    return;
  }

  console.log(`Found ${rows.length} blob(s) in the files table.\n`);

  for (const row of rows) {
    const folder: UploadFolder = folderForLegacyFilename(row.id);
    const target = path.join(UPLOADS_ROOT, folder, row.id);
    const oldUrl = `/api/files/${row.id}`;
    const newUrl = `/uploads/${folder}/${row.id}`;

    console.log(`- ${row.id} -> uploads/${folder}/ (${row.data.length} bytes)`);

    if (!APPLY) continue;

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, row.data);
    await rewriteReferences(oldUrl, newUrl);
  }

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with `npm run migrate:files:apply` to write files and update the database.");
  } else {
    console.log("\nExport complete. The files table was left untouched.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());