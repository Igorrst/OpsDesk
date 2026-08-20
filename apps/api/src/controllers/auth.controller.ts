import type { Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { clearRefreshCookie, setRefreshCookie } from "../lib/refresh-cookie.js";
import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";
import { AuthService } from "../services/auth.service.js";

const authService = new AuthService();

const getRefreshToken = (request: Request) => {
  const cookies: unknown = request.cookies;

  if (typeof cookies !== "object" || cookies === null) {
    return undefined;
  }

  const token: unknown = Reflect.get(cookies, env.REFRESH_COOKIE_NAME);
  return typeof token === "string" ? token : undefined;
};

const sendSession = (
  response: Response,
  session: Awaited<ReturnType<AuthService["login"]>>,
  statusCode: number,
) => {
  const { refreshToken, ...data } = session;
  setRefreshCookie(response, refreshToken);
  response.status(statusCode).json({ data });
};

export const register = async (request: Request, response: Response) => {
  const session = await authService.register(
    registerSchema.parse(request.body),
  );
  sendSession(response, session, 201);
};

export const login = async (request: Request, response: Response) => {
  const session = await authService.login(loginSchema.parse(request.body));
  sendSession(response, session, 200);
};

export const refresh = async (request: Request, response: Response) => {
  const refreshToken = getRefreshToken(request);

  if (!refreshToken) {
    throw new AppError(401, "refresh_token_required", "Refresh token required");
  }

  const session = await authService.refresh(refreshToken);
  sendSession(response, session, 200);
};

export const logout = async (request: Request, response: Response) => {
  await authService.logout(getRefreshToken(request));
  clearRefreshCookie(response);
  response.status(204).send();
};

export const me = async (request: Request, response: Response) => {
  if (!request.auth) {
    throw new AppError(
      401,
      "authentication_required",
      "Authentication required",
    );
  }

  const user = await authService.getCurrentUser(
    request.auth.userId,
    request.auth.organizationId,
  );
  response.status(200).json({ data: user });
};
