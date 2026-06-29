import { Router } from "express";

import { authRouter } from "@/modules/auth/auth.routes";
import { healthRouter } from "@/modules/health/health.routes";
import { transactionsRouter } from "@/modules/transactions/transactions.routes";
import { walletsRouter } from "@/modules/wallets/wallets.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/transactions", transactionsRouter);
routes.use("/wallets", walletsRouter);
routes.use(healthRouter);
