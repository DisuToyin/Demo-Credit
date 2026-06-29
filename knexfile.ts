import dotenv from "dotenv";
import type { Knex } from "knex";

dotenv.config();

const sharedConnection = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lendsqr",
};

const baseConfig: Knex.Config = {
  client: "mysql2",
  connection: sharedConnection,
  migrations: {
    directory: "./src/database/migrations",
    extension: "ts",
  },
  seeds: {
    directory: "./src/database/seeds",
    extension: "ts",
  },
  pool: {
    min: Number(process.env.DB_POOL_MIN || 2),
    max: Number(process.env.DB_POOL_MAX || 10),
  },
};

const config: Record<string, Knex.Config> = {
  development: baseConfig,
  test: {
    ...baseConfig,
    connection: {
      ...sharedConnection,
      database: process.env.DB_TEST_NAME || `${sharedConnection.database}_test`,
    },
  },
  production: baseConfig,
};

export = config;
