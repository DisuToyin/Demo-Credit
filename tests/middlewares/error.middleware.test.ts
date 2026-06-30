import type { NextFunction, Request, Response } from "express";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { z } from "zod";

import { errorMiddleware } from "@/middlewares/error.middleware";
import { AppError } from "@/utils/app.error";
import { ValidationError } from "@/utils/validate.request";

type ResponseMock = {
  status: ReturnType<typeof vi.fn<(statusCode: number) => ResponseMock>>;
  json: ReturnType<typeof vi.fn<(body: unknown) => ResponseMock>>;
};

const createResponseMock = (): ResponseMock => {
  const res = {
    status: vi.fn<(statusCode: number) => ResponseMock>(),
    json: vi.fn<(body: unknown) => ResponseMock>(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

const runErrorMiddleware = (error: unknown, res: ResponseMock): void => {
  errorMiddleware(
    error,
    {} as Request,
    res as unknown as Response,
    vi.fn() as NextFunction
  );
};

const createValidationError = (): ValidationError => {
  const result = z
    .object({
      name: z.string().min(1, "name is required."),
    })
    .safeParse({
      name: "",
    });

  if (result.success) {
    throw new Error("Expected validation to fail.");
  }

  return new ValidationError(result.error);
};

describe("errorMiddleware", () => {
  it("formats AppError responses", () => {
    const res = createResponseMock();

    runErrorMiddleware(new AppError("Not found.", 404, "NOT_FOUND"), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      code: "NOT_FOUND",
      message: "Not found.",
    });
  });

  it("formats ValidationError responses with validation issues", () => {
    const res = createResponseMock();

    runErrorMiddleware(createValidationError(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "name is required.",
      errors: ["name is required."],
    });
  });

  it("formats duplicate database errors as conflict responses", () => {
    const res = createResponseMock();

    runErrorMiddleware({ code: "ER_DUP_ENTRY" }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      code: "DUPLICATE_RECORD",
      message: "A record with one of the provided unique values already exists.",
    });
  });

  it("formats unknown errors as generic internal errors", () => {
    const res = createResponseMock();

    runErrorMiddleware(new Error("Sensitive internal detail"), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      code: "INTERNAL_ERROR",
      message: "Something went wrong.",
    });
  });
});
