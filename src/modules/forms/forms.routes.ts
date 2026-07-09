import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { createBoardApplication, createContactSubmission } from "./forms.controller.js";

export const formsRouter = Router();

formsRouter.post("/contact", asyncHandler(createContactSubmission));
formsRouter.post("/board-application", asyncHandler(createBoardApplication));
