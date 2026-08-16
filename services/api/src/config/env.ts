import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load repo-root .env when present (local/dev). CI has no .env — use schema defaults.
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}

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
    z.string().min(16).default('local-development-only-access-secret'),
  ),
  JWT_REFRESH_SECRET: optionalEmpty(
    z.string().min(16).default('local-development-only-refresh-secret'),
  ),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  MSG91_API_KEY: z.string().optional(),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:4001'),
  DELIVERY_SERVICE_URL: z.string().url().default('http://localhost:8086'),
  INVENTORY_SERVICE_URL: z.string().url().default('http://localhost:4010'),
  NOTIFICATIONS_SERVICE_URL: z.string().url().default('http://localhost:4007'),
  SEARCH_SERVICE_URL: z.string().url().default('http://localhost:4004'),
  FORUM_SERVICE_URL: z.string().url().default('http://localhost:8087'),
  EMERGENCY_SERVICE_URL: z.string().url().default('http://localhost:8088'),
  GOV_SERVICE_URL: z.string().url().default('http://localhost:8089'),
  ERP_INTERNAL_SECRET: z.string().default(''),
  ERP_SERVICE_URL: z.string().default('http://localhost:3010'),
  // Embedded Retail Smart ERP internal base (simple vendors). Falls back to ERP_SERVICE_URL.
  ERP_EMBEDDED_URL: optionalEmpty(z.string()).optional(),
  // Enterprise Frappe create_order method URL (enterprise vendors), e.g.
  // https://enterprise.doorli.me/api/method/doorli_core.api.create_order
  ERP_ENTERPRISE_URL: optionalEmpty(z.string()).optional(),
  // Enterprise Frappe provision_vendor method URL (derived from ERP_ENTERPRISE_URL if unset).
  ERP_ENTERPRISE_PROVISION_URL: optionalEmpty(z.string()).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
  }
  const data = result.data;
  if (data.NODE_ENV === 'production') {
    const missing = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ERP_INTERNAL_SECRET'].filter((key) => {
      const value = data[key as keyof Env];
      return !value || (typeof value === 'string' && value.startsWith('local-development-only-'));
    });
    if (data.DATABASE_URL.includes('localhost') || data.DATABASE_URL.includes('127.0.0.1')) missing.push('DATABASE_URL(non-local)');
    if (missing.length) throw new Error(`Production secrets/configuration missing: ${missing.join(', ')}`);
  }
  return data;
}

export const env = loadEnv();
