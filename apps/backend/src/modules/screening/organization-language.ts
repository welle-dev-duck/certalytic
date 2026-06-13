export type OrganizationLanguage = 'en' | 'de';

export function buildEvaluationLanguageInstruction(
  language: OrganizationLanguage,
): string {
  if (language === 'de') {
    return `[Output language]
Write every human-readable string in the JSON response in German (summaries, observations, follow-up suggestions, supplementary analyses, flag descriptions, and round analysis notes).
Keep JSON property names in English exactly as specified.
Scoring logic and numeric score fields are unchanged.`;
  }

  return `[Output language]
Write every human-readable string in the JSON response in English.
Keep JSON property names in English exactly as specified.`;
}

export function parseOrganizationLanguage(
  value: string | null | undefined,
): OrganizationLanguage {
  return value === 'de' ? 'de' : 'en';
}
