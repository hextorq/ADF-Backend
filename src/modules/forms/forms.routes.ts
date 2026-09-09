import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { 
  createBoardApplication, 
  createContactSubmission,
  getSmtpStatus,
  sendTestEmail,
} from "./forms.controller.js";

export const formsRouter = Router();

formsRouter.post("/contact", asyncHandler(createContactSubmission));
formsRouter.post("/board-application", asyncHandler(createBoardApplication));
formsRouter.get("/smtp-status", asyncHandler(getSmtpStatus));
formsRouter.post("/test-email", asyncHandler(sendTestEmail));

