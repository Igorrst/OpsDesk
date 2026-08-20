import type { RequestHandler } from "express";

import { AppError } from "../errors/app-error.js";
import type { UserRole } from "../generated/prisma/enums.js";

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError(401, "authentication_required", "Authentication required"),
      );
      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(
        new AppError(403, "insufficient_permission", "Insufficient permission"),
      );
      return;
    }

    next();
  };
};
