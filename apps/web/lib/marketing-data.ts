import {
  ENTERPRISE_PLAN,
  SUBSCRIPTION_PLANS,
} from "@/features/billing/plans";

export const MARKETING_STATS = {
  candidates_screened: "12,400+",
  customers: "180+",
  countries: "14",
  audio_hours: "2,800+",
  saved_millions: "€4.2M",
} as const;

export const MARKETING_ROADMAP = [
  {
    quarter: "Q3 2026",
    title: "ATS integrations",
    description:
      "Push integrity reports into Greenhouse, Lever, and Workday without manual copy-paste.",
  },
  {
    quarter: "Q4 2026",
    title: "Enterprise SSO",
    description:
      "SAML and OIDC single sign-on with seat provisioning for agency and in-house TA teams.",
  },
  {
    quarter: "Q1 2027",
    title: "Batch screening",
    description:
      "Upload a cohort of candidates against one role profile and compare integrity signals side by side.",
  },
  {
    quarter: "Q2 2027",
    title: "Public API & webhooks",
    description:
      "Programmatic screening triggers and signed webhook delivery for custom hiring stacks.",
  },
] as const;

export type MarketingPricingPlan = {
  value: string;
  label: string;
  price: number | null;
  tokens: number | null;
  seats: number;
  features: string[];
  highlighted?: boolean;
};

export const FREE_PLAN_TOKENS = SUBSCRIPTION_PLANS[0].tokens;

export function getMarketingPricingPlans(): MarketingPricingPlan[] {
  const [, starter, growth, scale] = SUBSCRIPTION_PLANS;

  return [
    {
      value: starter.value,
      label: starter.label,
      price: starter.price,
      tokens: starter.tokens,
      seats: starter.seats,
      features: [...starter.incrementalFeatures],
    },
    {
      value: growth.value,
      label: growth.label,
      price: growth.price,
      tokens: growth.tokens,
      seats: growth.seats,
      features: [...growth.incrementalFeatures],
      highlighted: true,
    },
    {
      value: scale.value,
      label: scale.label,
      price: scale.price,
      tokens: scale.tokens,
      seats: scale.seats,
      features: [...scale.incrementalFeatures],
    },
    {
      value: "enterprise",
      label: ENTERPRISE_PLAN.label,
      price: null,
      tokens: null,
      seats: 6,
      features: [
        "Everything in Scale, plus:",
        "ATS system integrations (Greenhouse, Lever, Workday)",
        "Single sign-on (SSO) & SAML",
        "Priority support with dedicated success manager",
        "Custom onboarding",
        "API access",
      ],
    },
  ];
}
