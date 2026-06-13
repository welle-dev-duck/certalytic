import { SUBSCRIPTION_PLANS } from "@/features/billing/plans";

export const MARKETING_STATS = {
  candidates_screened: "12,400+",
  customers: "180+",
  countries: "14",
  audio_hours: "2,800+",
  saved_millions: "€4.2M",
} as const;

export const MARKETING_ROADMAP = [
  { quarter: "Q3 2026", id: "ats" },
  { quarter: "Q4 2026", id: "sso" },
  { quarter: "Q1 2027", id: "batch" },
  { quarter: "Q2 2027", id: "api" },
] as const;

export const FREE_PLAN_TOKENS = SUBSCRIPTION_PLANS[0].tokens;
