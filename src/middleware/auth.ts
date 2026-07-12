import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";
import { verifyAdminToken } from "../modules/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
      adminEmail?: string;
    }
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function readAdminStatus(req: Request): boolean {
  const token = readBearerToken(req) ?? req.cookies?.[env.COOKIE_NAME];
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!readAdminStatus(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.isAdmin = true;
  req.adminEmail = env.ADMIN_EMAIL;
  next();
}
