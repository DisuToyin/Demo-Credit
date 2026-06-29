import type { Request, Response } from "express";

import {
  fundWalletSchema,
  transferFundsSchema,
  withdrawWalletSchema,
} from "@/modules/wallets/wallets.validation";
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

  public withdrawFunds = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { body } = validateRequest(withdrawWalletSchema, req);
    const result = await this.walletsService.withdrawFunds(req.user.id, body);

    sendSuccess(res, {
      message: "Withdrawal successful.",
      data: result,
    });
  };

  public transferFunds = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { body } = validateRequest(transferFundsSchema, req);
    const result = await this.walletsService.transferFunds(req.user.id, body);

    sendSuccess(res, {
      message: "Transfer successful.",
      data: result,
    });
  };
}
