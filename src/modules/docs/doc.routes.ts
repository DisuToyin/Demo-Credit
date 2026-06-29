import path from "node:path";

import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

const openApiPath = path.resolve(process.cwd(), "docs/openapi.yaml");
const openApiDocument = YAML.load(openApiPath) as Record<string, unknown>;

export const docRouter = Router();

docRouter.use((_req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

docRouter.get("/docs.json", (_req, res) => {
  res.json(openApiDocument);
});

docRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Demo Credit API Docs",
  })
);
