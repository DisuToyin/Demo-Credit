import type { Request, Response } from "express";

import {
  fundWalletSchema,
  transferFundsSchema,
  withdrawWalletSchema,
} from "@/modules/wallets/wallet.validation";
import { WalletService } from "@/modules/wallets/wallet.service";
import { sendSuccess } from "@/utils/api.response";
import { AppError } from "@/utils/app.error";
import { validateRequest } from "@/utils/validate.request";

export class WalletController {
  public constructor(private readonly walletService = new WalletService()) {}

  public fundWallet = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { body } = validateRequest(fundWalletSchema, req);
    const result = await this.walletService.fundWallet(req.user.id, body);

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
    const result = await this.walletService.withdrawFunds(req.user.id, body);

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
    const result = await this.walletService.transferFunds(req.user.id, body);

    sendSuccess(res, {
      message: "Transfer successful.",
      data: result,
    });
  };
}
