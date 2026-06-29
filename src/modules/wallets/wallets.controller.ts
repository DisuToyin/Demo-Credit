import type { Request, Response } from "express";

import { fundWalletSchema } from "@/modules/wallets/wallets.validation";
import { WalletsService } from "@/modules/wallets/wallets.service";
import { sendSuccess } from "@/utils/api.response";
import { AppError } from "@/utils/app.error";
import { validateRequest } from "@/utils/validate.request";

export class WalletsController {
  public constructor(private readonly walletsService = new WalletsService()) {}

  public fundWallet = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { body } = validateRequest(fundWalletSchema, req);
    const result = await this.walletsService.fundWallet(req.user.id, body);

    sendSuccess(res, {
      message: "Wallet funded successfully.",
      data: result,
    });
  };
}
