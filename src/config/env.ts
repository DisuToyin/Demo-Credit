import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  host: process.env.HOST || "127.0.0.1",
  adjutor: {
    baseUrl: process.env.ADJUTOR_BASE_URL || "https://adjutor.lendsqr.com/v2",
    apiKey: process.env.ADJUTOR_API_KEY || "",
  },
  database: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "lendsqr",
    poolMin: toNumber(process.env.DB_POOL_MIN, 2),
    poolMax: toNumber(process.env.DB_POOL_MAX, 10),
  },
};
