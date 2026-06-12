import { env } from './env';

export const productConfig = {
  maxTeamsPerUser: env.CERTALYTIC_MAX_TEAMS_PER_USER,

  rateLimits: {
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
  },

  scoreWeights: {
    cv: 0.25,
    interview: 0.5,
    crossSource: 0.15,
    identity: 0.1,
  },

  varianceThreshold: 20,

  roundWeights: {
    1: 0.25,
    2: 0.35,
    3: 0.4,
  },

  storage: {
    signedUrlTtlMinutes: env.CERTALYTIC_SIGNED_URL_TTL,
  },

  limits: {
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
  },

  transcript: {
    softWarningWords: 24_000,
    hardCapCharacters: 120_000,
    maxTranscriptFiles: 3,
  },

  plans: {
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
  },

  tokenPacks: {
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
  },

  queues: {
    default: env.CERTALYTIC_QUEUE,
    priority: env.CERTALYTIC_PRIORITY_QUEUE,
  },

  mistral: {
    apiKey: env.MISTRAL_API_KEY,
    baseUrl: env.MISTRAL_BASE_URL,
    ocrModel: env.MISTRAL_OCR_MODEL,
    chatModel: env.MISTRAL_CHAT_MODEL,
    timeout: env.MISTRAL_TIMEOUT,
  },

  s3: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_DEFAULT_REGION,
    bucket: env.AWS_BUCKET,
    endpoint: env.AWS_ENDPOINT,
    usePathStyleEndpoint: env.AWS_USE_PATH_STYLE_ENDPOINT,
  },

  company: {
    legalName: env.CERTALYTIC_COMPANY_LEGAL_NAME,
    addressLine: env.CERTALYTIC_COMPANY_ADDRESS,
    zip: env.CERTALYTIC_COMPANY_ZIP,
    city: env.CERTALYTIC_COMPANY_CITY,
    country: env.CERTALYTIC_COMPANY_COUNTRY,
    phone: env.CERTALYTIC_COMPANY_PHONE,
    email: env.CERTALYTIC_COMPANY_EMAIL,
    registrationNumber: env.CERTALYTIC_COMPANY_REG_NUMBER,
    vatId: env.CERTALYTIC_COMPANY_VAT_ID,
    managingDirector: env.CERTALYTIC_COMPANY_DIRECTOR,
  },

  social: {
    linkedin: env.CERTALYTIC_SOCIAL_LINKEDIN,
    github: env.CERTALYTIC_SOCIAL_GITHUB,
    x: env.CERTALYTIC_SOCIAL_X,
  },

  marketing: {
    stats: {
      candidatesScreened: env.CERTALYTIC_MARKETING_CANDIDATES_SCREENED,
      customers: env.CERTALYTIC_MARKETING_CUSTOMERS,
      countries: env.CERTALYTIC_MARKETING_COUNTRIES,
      savedMillions: env.CERTALYTIC_MARKETING_SAVED_MILLIONS,
    },
    roadmap: [
      {
        quarter: 'Q3 2026',
        title: 'ATS integrations',
        description:
          'Push integrity reports into Greenhouse, Lever, and Workday without manual copy-paste.',
      },
      {
        quarter: 'Q4 2026',
        title: 'Enterprise SSO',
        description:
          'SAML and OIDC single sign-on with seat provisioning for agency and in-house TA teams.',
      },
      {
        quarter: 'Q1 2027',
        title: 'Batch screening',
        description:
          'Upload a cohort of candidates against one role profile and compare integrity signals side by side.',
      },
      {
        quarter: 'Q2 2027',
        title: 'Public API & webhooks',
        description:
          'Programmatic screening triggers and signed webhook delivery for custom hiring stacks.',
      },
    ],
  },
} as const;

export type ProductConfig = typeof productConfig;
