import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod/v4";
import { AppError } from "../lib/errors.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
    res.status(409).json({
      error: {
        code: "CONFLICT",
        message: "A record with this value already exists",
      },
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
};
