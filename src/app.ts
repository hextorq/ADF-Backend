import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env.js";
import { UPLOADS_ROOT, ensureUploadsRoot } from "./lib/uploads.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { formsRouter } from "./modules/forms/forms.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import submissionsRouter from "./modules/submissions/submissions.routes.js";
import publicationsRouter from "./modules/publications/publications.routes.js";
import { programmesRouter } from "./modules/programmes/programmes.routes.js";
import { bookstoreRouter } from "./modules/bookstore/bookstore.routes.js";
import formatterRouter from "./modules/formatter/formatter.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestTiming } from "./middleware/requestTiming.js";

export const app = express();
ensureUploadsRoot();
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
app.use(
  ["/uploads", "/adf/uploads"],
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (req.path.endsWith(".docx") || req.path.endsWith(".doc")) {
      const filename = req.path.split("/").pop() || "manuscript.docx";
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else if (req.path.endsWith(".pdf")) {
      const filename = req.path.split("/").pop() || "manuscript.pdf";
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }
    next();
  },
  express.static(UPLOADS_ROOT, {
    index: false,
    dotfiles: "deny",
    maxAge: "30d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/forms", formsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/literary-submissions", submissionsRouter);
app.use("/api/publications", publicationsRouter);
app.use("/api/programmes", programmesRouter);
app.use("/api/bookstore", bookstoreRouter);
app.use("/api/formatter", formatterRouter);

// Ensure any unhandled /api route returns JSON 404 rather than HTML
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use(errorHandler);
