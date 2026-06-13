import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PORT: z.coerce.number().int().positive().default(3000),
  BASE_URL: z.url(),
  WEB_APP_URL: z.url(),
  SIGNUP_DISABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
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
  MISTRAL_BASE_URL: z.url().default('https://api.mistral.ai'),
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
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_ADDRESS: z.string().default(''),
  RESEND_FROM_NAME: z.string().min(1).default('Certalytic'),
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  SENTRY_DSN: z.string().default(''),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
}).superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') {
    return;
  }

  if (!value.RESEND_API_KEY) {
    ctx.addIssue({
      code: 'custom',
      path: ['RESEND_API_KEY'],
      message: 'RESEND_API_KEY is required in production.',
    });
  }

  if (!value.RESEND_FROM_ADDRESS) {
    ctx.addIssue({
      code: 'custom',
      path: ['RESEND_FROM_ADDRESS'],
      message: 'RESEND_FROM_ADDRESS is required in production.',
    });
  }
});

export const env = envSchema.parse(process.env);

export function resolveAuthCookieDomain(
  webAppUrl: string,
  override?: string,
): string {
  if (override) {
    return override.replace(/^\./, '');
  }

  return new URL(webAppUrl).hostname.replace(/^www\./, '');
}

export const scoreWeights = {
  cv: 0.25,
  interview: 0.5,
  crossSource: 0.15,
  identity: 0.1,
} as const;

export const roundWeights = {
  1: 0.25,
  2: 0.35,
  3: 0.4,
} as const;

export const varianceThreshold = 20;

export const limits = {
  cvMaxKilobytes: env.CERTALYTIC_CV_MAX_KB,
  transcriptFileMaxKilobytes: env.CERTALYTIC_TRANSCRIPT_FILE_MAX_KB,
  cvTextMaxWords: 10_000,
  cvTextMaxCharacters: 75_000,
  transcriptTextMaxWords: 20_000,
  transcriptTextMaxCharacters: 150_000,
  nameMaxCharacters: 255,
  emailMaxCharacters: 255,
  linkedinTextMaxCharacters: 100_000,
  interviewerNotesMaxCharacters: 50_000,
  githubUrlMaxCharacters: 2_048,
  roleTitleMaxCharacters: 255,
  roleDescriptionMaxCharacters: 20_000,
  mistralMaxInputTokens: env.CERTALYTIC_MISTRAL_MAX_INPUT_TOKENS,
  charsPerTokenEstimate: 4,
} as const;

export const transcriptLimits = {
  softWarningWords: 24_000,
  hardCapCharacters: 120_000,
  maxTranscriptFiles: 3,
} as const;

export const plans = {
  free: {
    name: 'Free',
    price: 0,
    seats: 1,
    tokens: 3,
    crossSource: false,
    crossSourceManual: false,
    fullBreakdown: false,
    tokenPacks: false,
    priorityQueue: false,
    watermarkedExports: true,
    savedRoles: true,
    roleContextAssets: false,
    maxRoleDocuments: 0,
    stripePrice: null,
  },
  starter: {
    name: 'Starter',
    price: 159,
    seats: 1,
    tokens: 20,
    crossSource: false,
    crossSourceManual: true,
    fullBreakdown: true,
    tokenPacks: true,
    priorityQueue: false,
    watermarkedExports: false,
    savedRoles: true,
    roleContextAssets: false,
    maxRoleDocuments: 0,
    stripePrice: env.STRIPE_PRICE_STARTER || null,
  },
  growth: {
    name: 'Growth',
    price: 349,
    seats: 3,
    tokens: 50,
    crossSource: true,
    crossSourceManual: true,
    fullBreakdown: true,
    tokenPacks: true,
    priorityQueue: false,
    watermarkedExports: false,
    savedRoles: true,
    roleContextAssets: false,
    maxRoleDocuments: 0,
    stripePrice: env.STRIPE_PRICE_GROWTH || null,
  },
  scale: {
    name: 'Scale',
    price: 799,
    seats: 5,
    tokens: 125,
    crossSource: true,
    crossSourceManual: true,
    fullBreakdown: true,
    tokenPacks: true,
    priorityQueue: true,
    watermarkedExports: false,
    savedRoles: true,
    roleContextAssets: true,
    maxRoleDocuments: 3,
    stripePrice: env.STRIPE_PRICE_SCALE || null,
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    seats: 6,
    tokens: null,
    crossSource: true,
    crossSourceManual: true,
    fullBreakdown: true,
    tokenPacks: true,
    priorityQueue: true,
    watermarkedExports: false,
    savedRoles: true,
    roleContextAssets: true,
    maxRoleDocuments: 3,
    stripePrice: null,
  },
} as const;

export const tokenPacks = {
  quickRefill: {
    name: 'Quick Refill',
    tokens: 10,
    price: 99,
    stripePrice: env.STRIPE_PRICE_PACK_QUICK || null,
  },
  pipelineSurge: {
    name: 'Pipeline Surge',
    tokens: 35,
    price: 299,
    stripePrice: env.STRIPE_PRICE_PACK_SURGE || null,
  },
  highVolumeBoost: {
    name: 'High-Volume Boost',
    tokens: 100,
    price: 750,
    stripePrice: env.STRIPE_PRICE_PACK_BOOST || null,
  },
} as const;

export const rateLimits = {
  login: {
    maxAttempts: env.CERTALYTIC_RATE_LIMIT_LOGIN,
    decaySeconds: 60,
    by: 'ip' as const,
  },
  register: {
    maxAttempts: env.CERTALYTIC_RATE_LIMIT_REGISTER,
    decaySeconds: 3_600,
    by: 'ip' as const,
  },
  passwordReset: {
    maxAttempts: env.CERTALYTIC_RATE_LIMIT_PASSWORD_RESET,
    decaySeconds: 3_600,
    by: 'ip' as const,
  },
  authenticated: {
    maxAttempts: env.CERTALYTIC_RATE_LIMIT_AUTHENTICATED,
    decaySeconds: 60,
    by: 'user' as const,
  },
  screening: {
    maxAttempts: env.CERTALYTIC_RATE_LIMIT_SCREENING,
    decaySeconds: 60,
    by: 'user' as const,
  },
} as const;

export type RateLimitName = keyof typeof rateLimits;
