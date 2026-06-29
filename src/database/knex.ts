import knex, { type Knex } from "knex";

import { env } from "@/config/env";

export const db: Knex = knex({
  client: "mysql2",
  connection: {
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
  },
  pool: {
    min: env.database.poolMin,
    max: env.database.poolMax,
  },
});

export const closeDatabase = async (): Promise<void> => {
  await db.destroy();
};
