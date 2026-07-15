import { Router } from "express";
import { submissionController, upload } from "./submissions.controller.js";
import { requireAdmin } from "../../middleware/auth.js"; // Assuming there's an auth middleware

const router = Router();

// Public Routes
router.get("/packages", submissionController.getPackages);

router.post(
  "/",
  upload.fields([
    { name: "manuscript", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "authorPhoto", maxCount: 1 }
  ]),
  submissionController.submit
);

router.get("/:id", submissionController.getSubmission);
router.post("/:id/payment", submissionController.mockPayment);

// Admin Routes (Requires Authentication/Authorization in a real app)
// For now, we mount them under /admin in the main router or protect them here.
router.get("/admin/all", submissionController.getAllSubmissions);
router.patch("/admin/:id/status", submissionController.updateStatus);

export default router;
