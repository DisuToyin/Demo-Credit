import type { Request, Response } from "express";

import { signupSchema } from "@/modules/users/users.validation";
import { UsersService } from "@/modules/users/users.service";
import { sendSuccess } from "@/utils/api.response";
import { validateRequest } from "@/utils/validate.request";

export class UsersController {
  public constructor(private readonly usersService = new UsersService()) {}

  public signup = async (req: Request, res: Response): Promise<void> => {
    const { body } = validateRequest(signupSchema, req);
    const result = await this.usersService.signup(body);

    sendSuccess(res, {
      statusCode: 201,
      message: "Account created successfully.",
      data: result,
    });
  };
}
