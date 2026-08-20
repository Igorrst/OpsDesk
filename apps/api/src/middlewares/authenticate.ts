import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";
import { verifyAccessToken } from "../lib/tokens.js";

export const authenticate: RequestHandler = async (
  request,
  _response,
  next,
) => {
  const authorization = request.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(
      new AppError(401, "authentication_required", "Authentication required"),
    );
    return;
  }

  request.auth = await verifyAccessToken(authorization.slice(7));
  next();
};
