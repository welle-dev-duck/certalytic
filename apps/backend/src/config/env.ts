import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  BASE_URL: z.url(),
  WEB_APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_STARTER: z.string().default(''),
  STRIPE_PRICE_GROWTH: z.string().default(''),
  STRIPE_PRICE_SCALE: z.string().default(''),
  STRIPE_PRICE_PACK_QUICK: z.string().default(''),
  STRIPE_PRICE_PACK_SURGE: z.string().default(''),
  STRIPE_PRICE_PACK_BOOST: z.string().default(''),
  MISTRAL_API_KEY: z.string().default(''),
  MISTRAL_BASE_URL: z.url().default('https://api.mistral.ai/v1'),
  MISTRAL_OCR_MODEL: z.string().default('mistral-ocr-latest'),
  MISTRAL_CHAT_MODEL: z.string().default('mistral-small-latest'),
  MISTRAL_TIMEOUT: z.coerce.number().int().positive().default(120),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_DEFAULT_REGION: z.string().default('eu-west-1'),
  AWS_BUCKET: z.string().default(''),
  AWS_ENDPOINT: z.string().optional(),
  AWS_USE_PATH_STYLE_ENDPOINT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  CERTALYTIC_SIGNED_URL_TTL: z.coerce.number().int().positive().default(15),
  CERTALYTIC_CV_MAX_KB: z.coerce.number().int().positive().default(5_120),
  CERTALYTIC_TRANSCRIPT_FILE_MAX_KB: z.coerce
    .number()
    .int()
    .positive()
    .default(5_120),
  CERTALYTIC_MISTRAL_MAX_INPUT_TOKENS: z.coerce
    .number()
    .int()
    .positive()
    .default(128_000),
  CERTALYTIC_MAX_TEAMS_PER_USER: z.coerce.number().int().positive().default(3),
  CERTALYTIC_RATE_LIMIT_LOGIN: z.coerce.number().int().positive().default(10),
  CERTALYTIC_RATE_LIMIT_REGISTER: z.coerce
    .number()
    .int()
    .positive()
    .default(5),
  CERTALYTIC_RATE_LIMIT_PASSWORD_RESET: z.coerce
    .number()
    .int()
    .positive()
    .default(5),
  CERTALYTIC_RATE_LIMIT_AUTHENTICATED: z.coerce
    .number()
    .int()
    .positive()
    .default(120),
  CERTALYTIC_RATE_LIMIT_SCREENING: z.coerce
    .number()
    .int()
    .positive()
    .default(10),
  CERTALYTIC_QUEUE: z.string().default('default'),
  CERTALYTIC_PRIORITY_QUEUE: z.string().default('screenings-priority'),
  CERTALYTIC_COMPANY_LEGAL_NAME: z.string().default('Certalytic GmbH'),
  CERTALYTIC_COMPANY_ADDRESS: z.string().default('Musterstraße 1'),
  CERTALYTIC_COMPANY_ZIP: z.string().default('10115'),
  CERTALYTIC_COMPANY_CITY: z.string().default('Berlin'),
  CERTALYTIC_COMPANY_COUNTRY: z.string().default('Germany'),
  CERTALYTIC_COMPANY_PHONE: z.string().default('+49 30 12345678'),
  CERTALYTIC_COMPANY_EMAIL: z.string().default('hello@certalytic.com'),
  CERTALYTIC_COMPANY_REG_NUMBER: z.string().default('HRB 000000'),
  CERTALYTIC_COMPANY_VAT_ID: z.string().default('DE000000000'),
  CERTALYTIC_COMPANY_DIRECTOR: z.string().default('Managing Director'),
  CERTALYTIC_SOCIAL_LINKEDIN: z
    .string()
    .default('https://linkedin.com/company/certalytic'),
  CERTALYTIC_SOCIAL_GITHUB: z.string().default('https://github.com/certalytic'),
  CERTALYTIC_SOCIAL_X: z.string().default('https://x.com/certalytic'),
  CERTALYTIC_MARKETING_CANDIDATES_SCREENED: z.string().default('12,400+'),
  CERTALYTIC_MARKETING_CUSTOMERS: z.string().default('180+'),
  CERTALYTIC_MARKETING_COUNTRIES: z.string().default('14'),
  CERTALYTIC_MARKETING_SAVED_MILLIONS: z.string().default('€4.2M'),
});

export const env = envSchema.parse(process.env);
