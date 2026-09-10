import type { Request, Response } from "express";
import { z } from "zod";
import { saveBoardApplication, saveContactSubmission } from "./forms.service.js";
import { 
  sendContactFormNotification, 
  sendContactAcknowledgment, 
  sendEmail 
} from "../../lib/email.service.js";

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
    console.error("[Contact Validation Error]", parsed.error.flatten());
    const firstIssue = parsed.error.issues[0];
    const fieldName = firstIssue?.path?.join(".") || "field";
    return res.status(400).json({ 
      error: `Invalid ${fieldName}: ${firstIssue?.message || "validation failed"}`,
      details: parsed.error.flatten() 
    });
  }


  // 1. Persist to database
  const row = await saveContactSubmission(parsed.data);

  // 2. Dispatch SMTP notifications asynchronously (non-blocking for UI responsiveness)
  Promise.allSettled([
    sendContactFormNotification({ ...parsed.data, id: row.id }),
    sendContactAcknowledgment({ ...parsed.data, id: row.id }),
  ]).then((results) => {
    results.forEach((r, idx) => {
      if (r.status === "rejected") {
        console.error(`[Contact Email] Task ${idx} failed:`, r.reason);
      }
    });
  });

  res.status(201).json({ id: row.id, success: true });
}

export async function createBoardApplication(req: Request, res: Response) {
  const parsed = boardApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid board application" });
  }

  const row = await saveBoardApplication(parsed.data);

  // Send admin notification about the board application
  const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com";
  sendEmail({
    to: adminEmail,
    subject: `[ADF Board Application] ${parsed.data.boardType} - ${parsed.data.fullName}`,
    text: `New ${parsed.data.boardType} application received from ${parsed.data.fullName} (${parsed.data.email}, ${parsed.data.affiliation}). Profile: ${parsed.data.profileLink || "N/A"}. Message: ${parsed.data.message || "N/A"}`,
    replyTo: parsed.data.email,
  }).catch((err) => {
    console.error("[Board Application Email] Failed to notify admin:", err);
  });

  res.status(201).json({ id: row.id, success: true });
}

export async function getSmtpStatus(req: Request, res: Response) {
  const { verifySmtp } = await import("../../lib/email.service.js");
  const result = await verifySmtp();
  res.json({
    configured: Boolean(process.env.SMTP_USER),
    user: process.env.SMTP_USER || null,
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || "465",
    receiver: process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com",
    ...result,
  });
}

export async function sendTestEmail(req: Request, res: Response) {
  const targetEmail = req.body?.to || process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || "academicdevelopmentforum24@gmail.com";
  const result = await sendEmail({
    to: targetEmail,
    subject: "ADF SMTP Test Configuration Email",
    text: "This is a test email sent from the Academic Development Forum (ADF) backend to verify SMTP configuration.",
    html: "<p>This is a <strong>test email</strong> sent from the Academic Development Forum (ADF) backend to verify SMTP configuration.</p>",
  });
  res.json(result);
}


