import type { Request, Response } from "express";
import { z } from "zod";
import { saveBoardApplication, saveContactSubmission } from "./forms.service.js";

const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  affiliation: z.string().trim().max(300).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(300),
  message: z.string().trim().min(2).max(5000),
});

const boardApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  affiliation: z.string().trim().min(2).max(300),
  profileLink: z.string().trim().url().optional().or(z.literal("")),
  boardType: z.enum(["Editorial Board", "Reviewer Network"]),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
});

export async function createContactSubmission(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid contact submission" });
  }

  const row = await saveContactSubmission(parsed.data);
  res.status(201).json({ id: row.id, success: true });
}

export async function createBoardApplication(req: Request, res: Response) {
  const parsed = boardApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid board application" });
  }

  const row = await saveBoardApplication(parsed.data);
  res.status(201).json({ id: row.id, success: true });
}
