import type { Request, Response } from "express";

import { AuthService } from "@/modules/auth/auth.service";
import { signinSchema, signupSchema } from "@/modules/auth/auth.validation";
import { sendSuccess } from "@/utils/api.response";
import { validateRequest } from "@/utils/validate.request";

export class AuthController {
  public constructor(private readonly authService = new AuthService()) {}

  public signup = async (req: Request, res: Response): Promise<void> => {
    const { body } = validateRequest(signupSchema, req);
    const result = await this.authService.signup(body);

    sendSuccess(res, {
      statusCode: 201,
      message: "Account created successfully.",
      data: result,
    });
  };

  public signin = async (req: Request, res: Response): Promise<void> => {
    const { body } = validateRequest(signinSchema, req);
    const result = await this.authService.signin(body);

    sendSuccess(res, {
      message: "Signin successful.",
      data: result,
    });
  };
}
