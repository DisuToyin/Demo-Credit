import type { Request } from "express";
import { z, ZodError, type ZodType } from "zod";

import { AppError } from "@/utils/app.error";

type RequestParts = {
  body: unknown;
  params: unknown;
  query: unknown;
};

export class ValidationError extends AppError {
  public readonly issues: string[];

  public constructor(error: ZodError) {
    const issues = error.issues.map((issue) => issue.message);

    super(issues[0] ?? "Invalid request payload.", 400, "VALIDATION_ERROR");
    this.issues = issues;
  }
}

export const validateRequest = <TSchema extends ZodType>(
  schema: TSchema,
  req: Request
): z.output<TSchema> => {
  const requestParts: RequestParts = {
    body: req.body as unknown,
    params: req.params,
    query: req.query,
  };

  const result = schema.safeParse(requestParts);

  if (!result.success) {
    throw new ValidationError(result.error);
  }

  return result.data;
};
