import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const optionalEmpty = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' || val === undefined ? undefined : val), schema);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://doorli:doorli@localhost:5432/doorli'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: optionalEmpty(
    z.string().min(16).default('doorli-dev-access-secret-change-in-prod'),
  ),
  JWT_REFRESH_SECRET: optionalEmpty(
    z.string().min(16).default('doorli-dev-refresh-secret-change-in-prod'),
  ),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  MSG91_API_KEY: z.string().optional(),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
