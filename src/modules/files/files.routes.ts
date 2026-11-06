import { Router } from "express";
import { pool } from "../../db/pool.js";
import { findLocalUpload, mimeForFilename } from "../../lib/uploads.js";

export const filesRouter = Router();

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/;

/**
 * LEGACY ONLY.
 *
 * New uploads are written to /uploads/<folder>/<file> by the storage layer and
 * served as static files. This route exists so blobs that were stored in the
 * `files` table before the switch keep working.
 */
filesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!SAFE_ID.test(id)) {
    return res.status(400).send("Invalid file id");
  }

  try {
    const result = await pool.query("SELECT * FROM files WHERE id = $1", [id]);

    if (result.rows.length > 0) {
      const file = result.rows[0];
      res.setHeader("Content-Type", mimeForFilename(id) || file.mimetype || "application/octet-stream");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox"
      );
      return res.send(file.data);
    }
  } catch (error: any) {
    console.warn("[filesRouter] DB query failed, attempting disk fallback:", error.message);
  }

  const localFilePath = findLocalUpload(id);
  if (localFilePath) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox"
    );
    return res.sendFile(localFilePath);
  }

  return res.status(404).send("File not found");
});