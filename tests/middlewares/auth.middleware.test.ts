import type { NextFunction, Request, Response } from "express";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { authenticate } from "@/middlewares/auth.middleware";
import type { AuthenticatedUser } from "@/modules/auth/auth.types";
import { AppError } from "@/utils/app.error";

const authRepositoryMocks = vi.hoisted(() => ({
  findUserByToken: vi.fn(),
}));

vi.mock("@/modules/auth/auth.repository", () => ({
  AuthRepository: vi.fn().mockImplementation(function AuthRepository() {
    return authRepositoryMocks;
  }),
}));

const authenticatedUser: AuthenticatedUser = {
  id: "user-id",
  first_name: "Ada",
  last_name: "Okafor",
  email: "ada.okafor@example.com",
  phone_number: "08012345678",
};

const buildRequest = (authorization?: string): Request =>
  ({
    headers: {
      authorization,
    },
  }) as Request;

describe("authenticate middleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    authRepositoryMocks.findUserByToken.mockReset();
    next = vi.fn();
  });

  it("attaches the authenticated user and calls next for a valid bearer token", async () => {
    const req = buildRequest("Bearer valid-token");
    authRepositoryMocks.findUserByToken.mockResolvedValue(authenticatedUser);

    await authenticate(req, {} as Response, next);

    expect(authRepositoryMocks.findUserByToken).toHaveBeenCalledWith("valid-token");
    expect(req.user).toEqual(authenticatedUser);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects requests without an authorization header", async () => {
    const req = buildRequest();

    await expect(authenticate(req, {} as Response, next)).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
    } satisfies Partial<AppError>);

    expect(authRepositoryMocks.findUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects authorization headers that are not bearer tokens", async () => {
    const req = buildRequest("Token invalid-token");

    await expect(authenticate(req, {} as Response, next)).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
    } satisfies Partial<AppError>);

    expect(authRepositoryMocks.findUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects empty bearer tokens", async () => {
    const req = buildRequest("Bearer ");

    await expect(authenticate(req, {} as Response, next)).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
    } satisfies Partial<AppError>);

    expect(authRepositoryMocks.findUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects invalid bearer tokens", async () => {
    const req = buildRequest("Bearer invalid-token");
    authRepositoryMocks.findUserByToken.mockResolvedValue(null);

    await expect(authenticate(req, {} as Response, next)).rejects.toMatchObject({
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
    } satisfies Partial<AppError>);

    expect(authRepositoryMocks.findUserByToken).toHaveBeenCalledWith("invalid-token");
    expect(next).not.toHaveBeenCalled();
  });
});
