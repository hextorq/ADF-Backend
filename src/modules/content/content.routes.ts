import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { listContent, listRecentContentEdits, updateContent } from "./content.controller.js";

export const contentRouter = Router();

contentRouter.get("/", asyncHandler(listContent));
contentRouter.get("/audit/recent", requireAdmin, asyncHandler(listRecentContentEdits));
contentRouter.patch("/:key", requireAdmin, asyncHandler(updateContent));
