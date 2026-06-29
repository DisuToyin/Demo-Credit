import { Router } from "express";

import { UsersController } from "@/modules/users/users.controller";

const usersController = new UsersController();

export const usersRouter = Router();

usersRouter.post("/signup", usersController.signup);
