import type { Request } from "express";
import {
  describe,
  expect,
  it,
} from "vitest";
import { z } from "zod";

import { validateRequest, ValidationError } from "@/utils/validate.request";

const schema = z.object({
  body: z.object({
    name: z.string().min(1, "name is required."),
  }),
});

describe("validateRequest", () => {
  it("returns parsed request data when validation succeeds", () => {
    const result = validateRequest(schema, {
      body: {
        name: "Ada",
      },
      params: {},
      query: {},
    } as Request);

    expect(result.body.name).toBe("Ada");
  });

  it("throws ValidationError when validation fails", () => {
    expect(() =>
      validateRequest(schema, {
        body: {
          name: "",
        },
        params: {},
        query: {},
      } as Request)
    ).toThrow(ValidationError);
  });
});
