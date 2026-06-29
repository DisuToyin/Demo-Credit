import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { TransactionsController } from "@/modules/transactions/transactions.controller";

const transactionsController = new TransactionsController();

export const transactionsRouter = Router();

transactionsRouter.get("/", authenticate, transactionsController.listTransactions);
