import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { TransactionController } from "@/modules/transactions/transaction.controller";

const transactionController = new TransactionController();

export const transactionRouter = Router();

transactionRouter.get("/", authenticate, transactionController.listTransactions);
