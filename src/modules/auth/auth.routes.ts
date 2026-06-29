import { Router } from "express";

import { AuthController } from "@/modules/auth/auth.controller";

const authController = new AuthController();

export const authRouter = Router();

authRouter.post("/signup", authController.signup);
authRouter.post("/signin", authController.signin);
