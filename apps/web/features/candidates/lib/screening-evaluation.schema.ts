import { z } from "zod";

export const scoreComponentSchema = z.object({
  score: z.number().nullable().optional(),
  summary: z.string(),
  indicators: z.array(z.string()),
  confidence_band: z.string(),
});

export const roundAnalysisSchema = z.object({
  round_number: z.number(),
  s_int: z.number(),
  s_id: z.number(),
  observations: z.array(z.string()),
  anomalies: z.array(z.string()),
  deep_dive_prompts: z.array(z.string()),
});

export const evaluationFlagSchema = z.object({
  type: z.string(),
  severity: z.string(),
  description: z.string(),
  confidence: z.number(),
});

export const platformMatrixRowSchema = z.object({
  score: z.number().nullable(),
  explanation: z.string(),
});

export const supplementaryAnalysisSchema = z.object({
  summary: z.string(),
  traits: z.array(z.string()),
  detail_label: z.string(),
  detail: z.string(),
  indicators: z.array(z.string()),
  motivation_signals: z.array(z.string()),
  concerns: z.array(z.string()),
});

export const screeningEvaluationSchema = z.object({
  s_cv: scoreComponentSchema,
  s_int: scoreComponentSchema,
  s_cross: scoreComponentSchema,
  s_id: scoreComponentSchema,
  follow_up_suggested: z.array(z.string()),
  anomalies: z.array(z.string()),
  round_analyses: z.array(roundAnalysisSchema),
  flags: z.array(evaluationFlagSchema),
  platform_matrix: z.object({
    linkedin_cv_match: platformMatrixRowSchema,
    github_experience_match: platformMatrixRowSchema,
    cross_platform_consistency: platformMatrixRowSchema,
  }),
  behaviour_analysis: supplementaryAnalysisSchema,
  personality_analysis: supplementaryAnalysisSchema,
});

export type ScoreComponent = z.infer<typeof scoreComponentSchema>;
export type RoundAnalysis = z.infer<typeof roundAnalysisSchema>;
export type EvaluationFlag = z.infer<typeof evaluationFlagSchema>;
export type ScreeningEvaluation = z.infer<typeof screeningEvaluationSchema>;

export function parseScreeningEvaluation(
  value: unknown,
): ScreeningEvaluation | null {
  const result = screeningEvaluationSchema.safeParse(value);
  return result.success ? result.data : null;
}
