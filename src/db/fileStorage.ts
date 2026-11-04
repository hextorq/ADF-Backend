import { pool } from "./pool.js";
import path from "path";
import fs from "fs";

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".docx",
  ".doc",
];

export async function saveFileToDB(file: Express.Multer.File): Promise<string> {
  return saveBufferToDB(file.buffer, file.originalname, file.mimetype, file.fieldname);
}

export async function saveBufferToDB(
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  fieldnamePrefix: string = "file"
): Promise<string> {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : "";
  const filename = fieldnamePrefix + "-" + uniqueSuffix + safeExt;

  try {
    await pool.query(
      "INSERT INTO files (id, filename, mimetype, data) VALUES ($1, $2, $3, $4)",
      [filename, originalname, mimetype, buffer]
    );
  } catch (dbErr: any) {
    console.warn("[fileStorage] Database save failed, saving to local uploads folder:", dbErr.message);
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  }

  return `/api/files/${filename}`;
}
