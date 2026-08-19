import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../../middleware/auth.js";
import { saveFileToDB } from "../../db/fileStorage.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isImageExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext);
    if (!file.mimetype.startsWith("image/") && !isImageExt) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.post("/image", requireAdmin, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  try {
    const url = await saveFileToDB(req.file);
    res.status(201).json({ url });
  } catch (err) {
    console.error("Failed to save image to DB:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
});
