import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { formsRouter } from "./modules/forms/forms.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");

app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/forms", formsRouter);
app.use("/api/uploads", uploadsRouter);

app.use(errorHandler);
