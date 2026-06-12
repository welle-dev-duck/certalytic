export const MAX_TRANSCRIPT_FILES = 3;

export const SCREENING_LIMITS = {
  cv_max_kilobytes: 5120,
  cv_text_max_words: 10_000,
  cv_text_max_characters: 75_000,
  transcript_text_max_words: 20_000,
  transcript_text_max_characters: 150_000,
  name_max_characters: 255,
  email_max_characters: 255,
  linkedin_text_max_characters: 100_000,
  interviewer_notes_max_characters: 50_000,
  github_url_max_characters: 2048,
  role_title_max_characters: 255,
  role_description_max_characters: 20_000,
} as const;

export type ScreeningLimits = typeof SCREENING_LIMITS;
