import { pool } from "./pool.js";
import path from "path";

export async function saveFileToDB(file: Express.Multer.File): Promise<string> {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname).toLowerCase();
  const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".pdf"].includes(ext) ? ext : "";
  const filename = file.fieldname + "-" + uniqueSuffix + safeExt;

  await pool.query(
    "INSERT INTO files (id, filename, mimetype, data) VALUES ($1, $2, $3, $4)",
    [filename, file.originalname, file.mimetype, file.buffer]
  );

  return `/api/files/${filename}`;
}
