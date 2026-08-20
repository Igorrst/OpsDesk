import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { requireTrustedOrigin } from "../middlewares/trusted-origin.js";

const authRateLimit = rateLimit({
  limit: 20,
  windowMs: 15 * 60_000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/register", requireTrustedOrigin, authRateLimit, register);
authRouter.post("/login", requireTrustedOrigin, authRateLimit, login);
authRouter.post("/refresh", requireTrustedOrigin, authRateLimit, refresh);
authRouter.post("/logout", requireTrustedOrigin, logout);
authRouter.get("/me", authenticate, me);
