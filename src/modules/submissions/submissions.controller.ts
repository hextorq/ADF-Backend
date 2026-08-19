import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { CreateSubmissionSchema, UpdateSubmissionStatusSchema } from "./submissions.schema.js";
import { submissionService } from "./submissions.service.js";
import { saveFileToDB } from "../../db/fileStorage.js";

// Setup Multer for memory uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for manuscripts
});

export const submissionController = {
  async getPackages(req: Request, res: Response) {
    try {
      const packages = await submissionService.getPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async submit(req: Request, res: Response) {
    try {
      // Parse body string values from FormData
      const parsedBody = {
        ...req.body,
        wordCount: Number(req.body.wordCount),
        pageCount: req.body.pageCount ? Number(req.body.pageCount) : undefined,
        packageId: req.body.packageId ? Number(req.body.packageId) : undefined,
        agreedOriginal: req.body.agreedOriginal === 'true',
        agreedCopyright: req.body.agreedCopyright === 'true',
        agreedNotPublished: req.body.agreedNotPublished === 'true',
        agreedPolicies: req.body.agreedPolicies === 'true',
      };

      const validatedData = CreateSubmissionSchema.parse(parsedBody);

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files || !files.manuscript || files.manuscript.length === 0) {
        return res.status(400).json({ error: "Manuscript file is required" });
      }

      const manuscriptUrl = await saveFileToDB(files.manuscript[0]);
      const coverUrl = files.coverImage ? await saveFileToDB(files.coverImage[0]) : undefined;
      const authorPhotoUrl = files.authorPhoto ? await saveFileToDB(files.authorPhoto[0]) : undefined;

      const fileUrls = {
        manuscriptUrl,
        coverUrl,
        authorPhotoUrl,
      };

      const submission = await submissionService.createSubmission(validatedData, fileUrls);
      res.status(201).json(submission);
    } catch (error: any) {
      console.error("Error creating submission:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getSubmission(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const submission = await submissionService.getSubmissionById(id);
      
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async mockPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Verify submission exists and is pending payment
      const submission = await submissionService.getSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      if (submission.payment_status === 'Paid') {
        return res.status(400).json({ error: "Submission is already paid" });
      }

      const updated = await submissionService.processMockPayment(id);
      res.json(updated);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Admin Endpoints
  async getAllSubmissions(req: Request, res: Response) {
    try {
      const submissions = await submissionService.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching all submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = UpdateSubmissionStatusSchema.parse(req.body);
      
      const updated = await submissionService.updateStatus(id, validatedData);
      if (!updated) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating status:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
};
