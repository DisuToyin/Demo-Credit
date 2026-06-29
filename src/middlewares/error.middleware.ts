import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

import { AppError } from "@/utils/app.error";
import { ValidationError } from "@/utils/validate.request";

type DatabaseErrorShape = {
  code?: unknown;
};

const isDatabaseErrorShape = (error: unknown): error is DatabaseErrorShape => {
  return typeof error === "object" && error !== null && "code" in error;
};

const getDatabaseErrorMessage = (error: unknown): string | null => {
  if (!isDatabaseErrorShape(error) || typeof error.code !== "string") {
    return null;
  }

  if (error.code === "ER_DUP_ENTRY") {
    return "A record with one of the provided unique values already exists.";
  }

  return null;
};

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: "error",
      code: error.errorCode,
      message: error.message,
      ...(error instanceof ValidationError ? { errors: error.issues } : {}),
    });
    return;
  }

  const databaseErrorMessage = getDatabaseErrorMessage(error);

  if (databaseErrorMessage) {
    res.status(409).json({
      status: "error",
      code: "DUPLICATE_RECORD",
      message: databaseErrorMessage,
    });
    return;
  }

  res.status(500).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message: "Something went wrong.",
  });
};
