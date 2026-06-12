export const SUBSCRIPTION_PLANS = [
  {
    value: "free",
    label: "Free",
    price: 0,
    tokens: 3,
    seats: 1,
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
    features: [] as string[],
    incrementalFeatures: [
      "20 screenings / month",
      "Full integrity breakdown",
      "Manual cross-source checks",
      "Token pack purchases",
    ],
    includesPlan: "Free",
  },
  {
    value: "growth",
    label: "Growth",
    price: 349,
    tokens: 50,
    seats: 3,
    features: [] as string[],
    incrementalFeatures: [
      "50 screenings / month",
      "3 seats",
      "Automated cross-source checks",
    ],
    includesPlan: "Starter",
  },
  {
    value: "scale",
    label: "Scale",
    price: 799,
    tokens: 125,
    seats: 5,
    features: [] as string[],
    incrementalFeatures: [
      "125 screenings / month",
      "5 seats",
      "Role context documents",
      "Priority queue",
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
  features: [
    "Unlimited seats & tokens",
    "Dedicated support",
    "Custom integrations",
    "SSO & audit logs",
  ],
};

export const CONTACT_EMAIL = "hello@certalytic.com";
