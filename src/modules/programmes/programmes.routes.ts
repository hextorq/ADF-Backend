import { Router } from "express";
import { getAllProgrammes, createProgramme, updateProgramme, deleteProgramme } from "./programmes.controller.js";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";

export const programmesRouter = Router();

programmesRouter.get("/", asyncHandler(getAllProgrammes));
programmesRouter.post("/", requireAdmin, asyncHandler(createProgramme));
programmesRouter.patch("/:id", requireAdmin, asyncHandler(updateProgramme));
programmesRouter.delete("/:id", requireAdmin, asyncHandler(deleteProgramme));
