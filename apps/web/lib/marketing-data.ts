import { SUBSCRIPTION_PLANS } from "@/features/billing/plans";
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

export const FREE_PLAN_TOKENS = SUBSCRIPTION_PLANS[0].tokens;
