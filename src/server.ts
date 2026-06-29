import { app } from "@/app";
import { env } from "@/config/env";
import { closeDatabase } from "@/database/knex";

const server = app.listen(env.port, env.host, () => {
  console.log(`Server is running on http://${env.host}:${env.port}`);
});

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  console.log(`${signal} received. Shutting down server.`);

  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
