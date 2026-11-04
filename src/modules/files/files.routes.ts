import { Router } from "express";
import path from "path";
import fs from "fs";
import { pool } from "../../db/pool.js";

export const filesRouter = Router();

filesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM files WHERE id = $1", [id]);

    if (result.rows.length > 0) {
      const file = result.rows[0];
      res.setHeader("Content-Type", file.mimetype);
      return res.send(file.data);
    }
  } catch (error: any) {
    console.warn("[filesRouter] DB query failed, attempting local disk fallback:", error.message);
  }

  // Fallback to local uploads folder
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  const localFilePath = path.join(uploadsDir, id);
  if (fs.existsSync(localFilePath)) {
    return res.sendFile(localFilePath);
  }

  return res.status(404).send("File not found");
});
