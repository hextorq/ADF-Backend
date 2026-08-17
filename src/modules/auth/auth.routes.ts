import { Router } from "express";
import { login, logout, me, ssoLogin } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", me);
authRouter.get("/sso", ssoLogin);
