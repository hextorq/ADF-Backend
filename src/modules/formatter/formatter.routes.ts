import { Router } from "express";
import multer from "multer";
import { formatterController } from "./formatter.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// Author / Public Endpoints
router.post("/process", upload.single("manuscript"), formatterController.process);
router.get("/config", formatterController.getConfig);

// Admin Endpoints
router.put("/config", formatterController.updateConfig);
router.get("/submissions", formatterController.getSubmissions);

export default router;
