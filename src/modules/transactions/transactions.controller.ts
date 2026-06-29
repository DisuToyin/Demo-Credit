import type { Request, Response } from "express";

import { listTransactionsSchema } from "@/modules/transactions/transactions.validation";
import { TransactionsService } from "@/modules/transactions/transactions.service";
import { sendSuccess } from "@/utils/api.response";
import { AppError } from "@/utils/app.error";
import { validateRequest } from "@/utils/validate.request";

export class TransactionsController {
  public constructor(
    private readonly transactionsService = new TransactionsService()
  ) {}

  public listTransactions = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication token is required.", 401, "UNAUTHENTICATED");
    }

    const { query } = validateRequest(listTransactionsSchema, req);
    const result = await this.transactionsService.listTransactions(req.user.id, query);

    sendSuccess(res, {
      message: "Transactions retrieved successfully.",
      data: result,
    });
  };
}
