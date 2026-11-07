import { Router } from "express";
import {
  getLiterarySubmissions,
  updateLiterarySubmission,
  publishToBookStore,
  getChapterVolumes,
  createChapterVolume,
  updateChapterVolume,
  submitChapter,
  getChapterSubmissions,
  updateChapterStage,
  deleteLiterarySubmission,
  deleteChapterVolume,
  deleteChapterSubmission,
  getAbstractSubmissions,
  submitAbstract,
  updateAbstractStatus,
  updateAbstractPayment,
  deleteAbstractSubmission,
  updateAbstractAttachments,
} from "./publications.controller.js";
import { upload } from "../submissions/submissions.controller.js"; // Reuse multer upload

const router = Router();

// --- LITERARY PUBLICATIONS (Admin extensions to existing flow) ---
router.get("/literary/admin", getLiterarySubmissions);
router.patch("/literary/admin/:id", updateLiterarySubmission);
router.post("/literary/admin/:id/publish", publishToBookStore);
router.delete("/literary/admin/:id", deleteLiterarySubmission);

// --- CHAPTER PUBLICATIONS ---
router.get("/chapters/volumes", getChapterVolumes);
router.post(
  "/chapters/volumes", 
  upload.fields([{ name: "cover_image", maxCount: 1 }, { name: "pdf_file", maxCount: 1 }]), 
  createChapterVolume
); // admin
router.patch(
  "/chapters/volumes/:id", 
  upload.fields([{ name: "cover_image", maxCount: 1 }, { name: "pdf_file", maxCount: 1 }]), 
  updateChapterVolume
); // admin
router.delete("/chapters/volumes/:id", deleteChapterVolume); // admin

router.post(
  "/chapters/submit",
  upload.fields([{ name: "manuscript", maxCount: 1 }, { name: "payment_screenshot", maxCount: 1 }]),
  submitChapter
);

router.get("/chapters/admin", getChapterSubmissions);
router.patch("/chapters/admin/:id/stage", updateChapterStage);
router.delete("/chapters/admin/:id", deleteChapterSubmission);

// --- CALL FOR ABSTRACTS ---
router.post(
  "/abstracts/submit",
  upload.fields([{ name: "manuscript", maxCount: 1 }, { name: "payment_screenshot", maxCount: 1 }]),
  submitAbstract
);
router.get("/abstracts/admin", getAbstractSubmissions);
router.patch("/abstracts/admin/:id/status", updateAbstractStatus);
router.patch("/abstracts/admin/:id/payment", updateAbstractPayment);
router.delete("/abstracts/admin/:id", deleteAbstractSubmission);
router.patch(
  "/abstracts/admin/:id/attachments",
  upload.fields([{ name: "manuscript", maxCount: 1 }, { name: "payment_screenshot", maxCount: 1 }]),
  updateAbstractAttachments
);

export default router;
