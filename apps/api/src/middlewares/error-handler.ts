import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: "route_not_found",
      message: "Route not found",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid request data",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  logger.error({ error }, "Unhandled request error");
  response.status(500).json({
    error: {
      code: "internal_server_error",
      message: "Internal server error",
    },
  });
};
