export const SUBSCRIPTION_PLANS = [
  {
    value: "free",
    label: "Free",
    price: 0,
    tokens: 3,
    seats: 1,
    recommendation: null as string | null,
    features: [
      "3 screenings / month",
      "Saved roles",
      "Watermarked PDF exports",
    ],
    incrementalFeatures: [] as string[],
    includesPlan: null as string | null,
  },
  {
    value: "starter",
    label: "Starter",
    price: 159,
    tokens: 20,
    seats: 1,
    recommendation:
      "Choose this if you expect to manage around 4 roles / month",
    features: [
      "20 screenings / month",
      "Full integrity breakdown",
      "Cross-Reference checks",
      "Refillable screening tokens",
      "Export Integrity Dossiers in 2 languages",
      "Email Support",
    ],
    incrementalFeatures: [] as string[],
    includesPlan: null as string | null,
  },
  {
    value: "growth",
    label: "Growth",
    price: 349,
    tokens: 50,
    seats: 3,
    recommendation:
      "Choose this if you expect to manage around 10 roles / month",
    features: [] as string[],
    incrementalFeatures: [
      "50 screenings / month",
      "3 seats",
      "Priority Email Support",
    ],
    includesPlan: "Starter",
  },
  {
    value: "scale",
    label: "Scale",
    price: 799,
    tokens: 125,
    seats: 5,
    recommendation:
      "Choose this if you expect to manage around 25 roles / month",
    features: [] as string[],
    incrementalFeatures: [
      "125 screenings / month",
      "5 seats",
      "Priority Queue (faster Candidate evaluation)",
      "Premium Support (Slack Access)",
    ],
    includesPlan: "Growth",
  },
] as const;

export const TOKEN_PACKS = [
  { key: "quick_refill" as const, name: "Quick Refill", tokens: 10, price: 99 },
  {
    key: "pipeline_surge" as const,
    name: "Pipeline Surge",
    tokens: 35,
    price: 299,
  },
  {
    key: "high_volume_boost" as const,
    name: "High-Volume Boost",
    tokens: 100,
    price: 750,
  },
];

export const ENTERPRISE_PLAN = {
  label: "Enterprise",
  recommendation: "Choose this if you have custom needs.",
  features: [
    "Unlimited seats & tokens",
    "ATS system integrations (Greenhouse, Lever, Workday)",
    "Single sign-on (SSO) & SAML",
    "Priority support with dedicated success manager",
    "Custom onboarding",
    "API access",
  ],
};

export const CONTACT_EMAIL = "hello@certalytic.com";
