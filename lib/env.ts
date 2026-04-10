import { z } from "zod/v4";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_URL: z.url(),
});

export const env = envSchema.parse(process.env);
