import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().startsWith("postgresql://"),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default("opsdesk-api"),
  JWT_AUDIENCE: z.string().min(1).default("opsdesk-web"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_COOKIE_NAME: z.string().min(1).default("opsdesk_refresh_token"),
});

export const env = envSchema.parse(process.env);
