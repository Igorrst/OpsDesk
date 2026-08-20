import type { CookieOptions, Response } from "express";

import { env } from "../config/env.js";

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/auth",
});

export const setRefreshCookie = (response: Response, token: string) => {
  response.cookie(env.REFRESH_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1_000,
  });
};

export const clearRefreshCookie = (response: Response) => {
  response.clearCookie(env.REFRESH_COOKIE_NAME, cookieOptions());
};
