import { describe, expect, it } from "vitest";

import { parseScreeningEvaluation } from "@/features/candidates/lib/screening-evaluation.schema";

const validEvaluation = {
  s_cv: {
    score: 80,
    summary: "CV looks consistent.",
    indicators: ["Stable employment timeline"],
    confidence_band: "high",
  },
  s_int: {
    score: 72,
    summary: "Interview signal is solid.",
    indicators: [],
    confidence_band: "medium",
  },
  s_cross: {
    score: null,
    summary: "Not evaluated.",
    indicators: [],
    confidence_band: "not-evaluated",
  },
  s_id: {
    score: 68,
    summary: "Identity signal is acceptable.",
    indicators: [],
    confidence_band: "medium",
  },
  follow_up_suggested: ["Ask about architecture trade-offs"],
  anomalies: [],
  round_analyses: [],
  flags: [],
  platform_matrix: {
    linkedin_cv_match: { score: null, explanation: "Not provided." },
    github_experience_match: { score: null, explanation: "Not provided." },
    cross_platform_consistency: { score: null, explanation: "Not provided." },
  },
  behaviour_analysis: {
    summary: "Calm communicator.",
    traits: ["Structured"],
    detail_label: "Communication style",
    detail: "Direct and concise.",
    indicators: [],
    motivation_signals: [],
    concerns: [],
  },
  personality_analysis: {
    summary: "Independent contributor profile.",
    traits: ["Analytical"],
    detail_label: "Work style",
    detail: "Prefers deep work.",
    indicators: [],
    motivation_signals: [],
    concerns: [],
  },
};

describe("parseScreeningEvaluation", () => {
  it("accepts valid evaluation payloads", () => {
    expect(parseScreeningEvaluation(validEvaluation)?.s_cv.score).toBe(80);
  });

  it("returns null for invalid payloads", () => {
    expect(parseScreeningEvaluation({ invalid: true })).toBeNull();
  });
});
