import type { Request, Response } from "express";
import { z } from "zod";
import { getAllContent, getRecentContentEdits, upsertContent } from "./content.service.js";

export async function listContent(_req: Request, res: Response) {
  const items = await getAllContent();
  res.json({ items });
}

const updateSchema = z.object({
  value: z.string().trim().min(1).max(5000),
});

export async function updateContent(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const key = req.params.key;
  const row = await upsertContent(key, parsed.data.value, req.adminEmail ?? "admin");
  res.json(row);
}

export async function listRecentContentEdits(_req: Request, res: Response) {
  const edits = await getRecentContentEdits(20);
  res.json({ edits });
}
