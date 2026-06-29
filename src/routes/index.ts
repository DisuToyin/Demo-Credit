import { Router } from "express";

import { authRouter } from "@/modules/auth/auth.routes";
import { healthRouter } from "@/modules/health/health.routes";
import { transactionRouter } from "@/modules/transactions/transaction.routes";
import { walletRouter } from "@/modules/wallets/wallet.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/transactions", transactionRouter);
routes.use("/wallets", walletRouter);
routes.use(healthRouter);
