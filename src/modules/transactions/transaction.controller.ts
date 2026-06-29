import type { Request, Response } from "express";

import { listTransactionsSchema } from "@/modules/transactions/transaction.validation";
import { TransactionService } from "@/modules/transactions/transaction.service";
import { sendSuccess } from "@/utils/api.response";
import { AppError } from "@/utils/app.error";
import { validateRequest } from "@/utils/validate.request";

export class TransactionController {
  public constructor(
    private readonly transactionService = new TransactionService()
  ) {}

  public listTransactions = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { query } = validateRequest(listTransactionsSchema, req);
    const result = await this.transactionService.listTransactions(req.user.id, query);

    sendSuccess(res, {
      message: "Transactions retrieved successfully.",
      data: result,
    });
  };
}
