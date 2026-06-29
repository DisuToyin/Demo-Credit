import { Router } from "express";

import { usersRouter } from "@/modules/users/users.routes";
import { healthRouter } from "@/modules/health/health.routes";

export const routes = Router();

routes.use("/users", usersRouter);
routes.use(healthRouter);
