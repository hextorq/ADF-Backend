import { Router } from "express";
import {
  getLiterarySubmissions,
  updateLiteraryStage,
  publishToBookStore,
  getChapterVolumes,
  createChapterVolume,
  updateChapterVolume,
  submitChapter,
  getChapterSubmissions,
  updateChapterStage
} from "./publications.controller.js";
import { upload } from "../submissions/submissions.controller.js"; // Reuse multer upload

const router = Router();

// --- LITERARY PUBLICATIONS (Admin extensions to existing flow) ---
router.get("/literary/admin", getLiterarySubmissions);
router.patch("/literary/admin/:id/stage", updateLiteraryStage);
router.post("/literary/admin/:id/publish", publishToBookStore);

// --- CHAPTER PUBLICATIONS ---
router.get("/chapters/volumes", getChapterVolumes);
router.post("/chapters/volumes", upload.single("cover_image"), createChapterVolume); // admin
router.patch("/chapters/volumes/:id", updateChapterVolume); // admin

router.post(
  "/chapters/submit",
  upload.fields([{ name: "manuscript", maxCount: 1 }]),
  submitChapter
);

router.get("/chapters/admin", getChapterSubmissions);
router.patch("/chapters/admin/:id/stage", updateChapterStage);

export default router;
