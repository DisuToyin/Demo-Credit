import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { WalletController } from "@/modules/wallets/wallet.controller";

const walletController = new WalletController();

export const walletRouter = Router();

walletRouter.post("/fund", authenticate, walletController.fundWallet);
walletRouter.post("/transfer", authenticate, walletController.transferFunds);
walletRouter.post("/withdraw", authenticate, walletController.withdrawFunds);
