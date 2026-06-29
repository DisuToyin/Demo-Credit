import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorMiddleware } from "@/middlewares/error.middleware";
import { routes } from "@/routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorMiddleware);
