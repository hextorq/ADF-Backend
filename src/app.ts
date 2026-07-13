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
import { requestTiming } from "./middleware/requestTiming.js";

export const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, "../uploads");
const allowedOrigins = env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes("*");

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  exposedHeaders: ["X-CMS-DB-Time"],
}));
app.use(cookieParser());
app.use(express.json());
app.use(requestTiming);
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/forms", formsRouter);
app.use("/api/uploads", uploadsRouter);

app.use(errorHandler);
