import {
  describe,
  expect,
  it,
} from "vitest";

import { signinSchema, signupSchema } from "@/modules/auth/auth.validation";

const validSignupRequest = {
  body: {
    first_name: "Ada",
    last_name: "Okafor",
    email: "ADA.OKAFOR@EXAMPLE.COM",
    phone_number: "08012345678",
    bvn: "12345678901",
    password: "Password123",
  },
};

describe("auth validation schemas", () => {
  it("accepts valid signup data and normalizes email", () => {
    const result = signupSchema.parse(validSignupRequest);

    expect(result.body.email).toBe("ada.okafor@example.com");
  });

  it("rejects signup with invalid email", () => {
    const result = signupSchema.safeParse({
      body: {
        ...validSignupRequest.body,
        email: "not-an-email",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects signup with invalid BVN", () => {
    const result = signupSchema.safeParse({
      body: {
        ...validSignupRequest.body,
        bvn: "12345",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects signup with short password", () => {
    const result = signupSchema.safeParse({
      body: {
        ...validSignupRequest.body,
        password: "short",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid signin data and normalizes email", () => {
    const result = signinSchema.parse({
      body: {
        email: "ADA.OKAFOR@EXAMPLE.COM",
        password: "Password123",
      },
    });

    expect(result.body.email).toBe("ada.okafor@example.com");
  });

  it("rejects signin with empty password", () => {
    const result = signinSchema.safeParse({
      body: {
        email: "ada.okafor@example.com",
        password: "",
      },
    });

    expect(result.success).toBe(false);
  });
});
