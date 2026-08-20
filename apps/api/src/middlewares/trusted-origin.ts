import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

export const requireTrustedOrigin: RequestHandler = (
  request,
  _response,
  next,
) => {
  const origin = request.header("origin");

  if (origin && origin !== env.CORS_ORIGIN) {
    next(new AppError(403, "untrusted_origin", "Untrusted request origin"));
    return;
  }

  next();
};
