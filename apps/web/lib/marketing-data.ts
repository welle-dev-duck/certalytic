import { SUBSCRIPTION_PLANS } from "@/features/billing/plans";

export const MARKETING_STATS = {
  candidates_screened: "100+",
  customers: "5",
  countries: "2",
  audio_hours: "100+",
  saved_millions: "€0.5M",
} as const;

export const MARKETING_ROADMAP = [
  { quarter: "Q3 2026", id: "ats" },
  { quarter: "Q4 2026", id: "sso" },
  { quarter: "Q1 2027", id: "batch" },
  { quarter: "Q2 2027", id: "api" },
] as const;

export const FREE_PLAN_TOKENS = SUBSCRIPTION_PLANS[0].tokens;
