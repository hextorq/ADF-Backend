import type { NextFunction, Request, Response } from "express";

function getClientIp(req: Request) {
  const forwardedFor = req.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function requestTiming(req: Request, res: Response, next: NextFunction) {
  const startedAt = performance.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api/")) return;
    const elapsedMs = performance.now() - startedAt;
    const cmsDbTime = res.getHeader("X-CMS-DB-Time");
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const tag = elapsedMs >= 500 ? "slow-api" : "api";
    const parts = [
      `[${tag}]`,
      `level=${level}`,
      `method=${req.method}`,
      `path=${req.originalUrl}`,
      `status=${res.statusCode}`,
      `duration=${elapsedMs.toFixed(1)}ms`,
      cmsDbTime ? `cmsDb=${cmsDbTime}` : null,
      `ip=${getClientIp(req)}`,
      req.get("origin") ? `origin=${req.get("origin")}` : null,
    ].filter(Boolean);

    console.log(parts.join(" "));
  });
  next();
}
