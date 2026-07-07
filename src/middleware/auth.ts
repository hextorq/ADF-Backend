import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";
import { verifyAdminToken } from "../modules/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

export function readAdminStatus(req: Request): boolean {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!readAdminStatus(req)) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.isAdmin = true;
  next();
}
