import jwt from "jsonwebtoken";
import { env } from "../../env.js";

export type AdminTokenPayload = { role: "admin" };

export function verifyCredentials(email: string, password: string): boolean {
  return email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD;
}

export function signAdminToken(): string {
  const payload: AdminTokenPayload = { role: "admin" };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}
