import { Router } from "express";

import { authenticate } from "@/middlewares/auth.middleware";
import { WalletsController } from "@/modules/wallets/wallets.controller";

const walletsController = new WalletsController();

export const walletsRouter = Router();

walletsRouter.post("/fund", authenticate, walletsController.fundWallet);
