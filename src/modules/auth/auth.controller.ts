import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../../env.js";
import { signAdminToken, verifyCredentials } from "./auth.service.js";
import { readAdminStatus } from "../../middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { email, password } = parsed.data;
  if (!verifyCredentials(email, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signAdminToken();
  res.cookie(env.COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: { email, role: "admin" } });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME, cookieOptions);
  res.status(204).send();
}

export function me(req: Request, res: Response) {
  const isAdmin = readAdminStatus(req);
  res.json({ isAdmin, email: isAdmin ? env.ADMIN_EMAIL : null });
}
