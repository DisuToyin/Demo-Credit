import type { NextFunction, Request, Response } from "express";

import { AuthRepository } from "@/modules/auth/auth.repository";
import { AppError } from "@/utils/app.error";

const BEARER_PREFIX = "Bearer ";

const authRepository = new AuthRepository();

const getTokenFromHeader = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader || !authorizationHeader.startsWith(BEARER_PREFIX)) {
    throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
  }

  return token;
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = getTokenFromHeader(req.headers.authorization);
  const user = await authRepository.findUserByToken(token);

  if (!user) {
    throw new AppError("Invalid authentication token.", 401, "UNAUTHENTICATED");
  }

  req.user = user;
  next();
};
