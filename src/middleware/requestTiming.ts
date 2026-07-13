import type { NextFunction, Request, Response } from "express";

export function requestTiming(req: Request, res: Response, next: NextFunction) {
  const startedAt = performance.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api/")) return;
    const elapsedMs = performance.now() - startedAt;
    if (elapsedMs < 500) return;
    console.log(
      `[slow-api] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`
    );
  });
  next();
}
