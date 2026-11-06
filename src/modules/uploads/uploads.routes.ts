import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { readAdminStatus } from "../../middleware/auth.js";
import {
  UPLOAD_FOLDERS,
  UploadError,
  type UploadFolder,
  getFolderRules,
  isPublicFolder,
  isUploadFolder,
  listHttpFolders,
  saveUpload,
} from "../../lib/uploads.js";

export const uploadsRouter = Router();

function buildSingleFileMiddleware(folder: UploadFolder) {
  const rules = getFolderRules(folder);

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: rules.maxBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (!ext || !rules.extensions.includes(ext)) {
        cb(new UploadError(`File type "${ext || "unknown"}" is not allowed in "${folder}"`));
        return;
      }
      cb(null, true);
    },
  }).any();
}

function sendUploadError(res: Response, err: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File is too large for this folder" });
    }
    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Only one file per upload is allowed" });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof UploadError) {
    return res.status(400).json({ error: err.message });
  }

  console.error("[uploads] unexpected error:", err);
  return res.status(500).json({ error: "Failed to store uploaded file" });
}

function handleUpload(folder: UploadFolder) {
  const middleware = buildSingleFileMiddleware(folder);

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, async (err: any) => {
      if (err) return sendUploadError(res, err);

      const files = req.files as Express.Multer.File[] | undefined;
      const file = files?.[0];
      if (!file) {
        return res.status(400).json({
          error: `No file received. Send one file in any field to /api/uploads/${folder}`,
        });
      }

      try {
        const saved = await saveUpload(file, folder);
        return res.status(201).json(saved);
      } catch (error) {
        if (error instanceof UploadError) {
          return res.status(400).json({ error: error.message });
        }
        console.error(`[uploads] failed to save file in ${folder}:`, error);
        return res.status(500).json({ error: "Failed to store uploaded file" });
      }
    });
  };
}

/** Discover the allowed folders and their rules (public list without a token). */
uploadsRouter.get("/", (req, res) => {
  res.json({ folders: listHttpFolders(readAdminStatus(req)) });
});

/**
 * Legacy alias kept for older clients. Always lands in uploads/cms.
 * cms is public right now, so the alias is too.
 */
uploadsRouter.post("/image", handleUpload("cms"));

/**
 * POST /api/uploads/:folder
 *
 * The single upload entry point. The folder decides:
 *  - where the file is written (uploads/<folder>/)
 *  - which extensions and size are accepted
 *  - whether an admin token is required
 *
 * Response: { url, path, folder, filename, size, mimetype }
 * Store `url` (or `path`) in the database — never the bytes.
 */
uploadsRouter.post("/:folder", (req, res, next) => {
  const folder = String(req.params.folder || "");

  if (!isUploadFolder(folder) || !UPLOAD_FOLDERS[folder].http) {
    return res.status(404).json({
      error: `Unknown upload folder "${folder}". Allowed: ${Object.keys(UPLOAD_FOLDERS)
        .filter((key) => UPLOAD_FOLDERS[key as UploadFolder].http)
        .join(", ")}`,
    });
  }

  if (!isPublicFolder(folder) && !readAdminStatus(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return handleUpload(folder)(req, res, next);
});