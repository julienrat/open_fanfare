import { config as loadEnv } from "dotenv";

loadEnv();

const requiredEnv = ["ADMIN_SECRET", "DATABASE_URL"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const appConfig = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  adminSecret: process.env.ADMIN_SECRET ?? "",
};

