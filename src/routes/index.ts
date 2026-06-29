import { Router } from "express";

import { authRouter } from "@/modules/auth/auth.routes";
import { healthRouter } from "@/modules/health/health.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use(healthRouter);
