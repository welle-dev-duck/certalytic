import { rgb } from 'pdf-lib';

export const PAGE_WIDTH = 595;
export const PAGE_HEIGHT = 842;
export const MARGIN = 48;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const SPACING = {
  sectionTop: 22,
  sectionBottom: 14,
  subsectionTop: 14,
  subsectionBottom: 8,
  block: 12,
  paragraph: 8,
  item: 6,
  tight: 4,
  progressBar: 30,
};

export const TYPE = {
  preTitle: 9,
  docTitle: 20,
  docMeta: 10,
  section: 13,
  subsection: 11,
  label: 8,
  body: 9,
  param: 9,
  hint: 7,
};

export const COLORS = {
  primary: rgb(0.18, 0.36, 0.33),
  text: rgb(0.1, 0.18, 0.16),
  muted: rgb(0.36, 0.44, 0.41),
  label: rgb(0.45, 0.52, 0.5),
  border: rgb(0.77, 0.83, 0.81),
  track: rgb(0.9, 0.93, 0.92),
  panel: rgb(0.97, 0.98, 0.98),
  disclaimer: rgb(0.33, 0.29, 0.07),
  high: rgb(0.06, 0.73, 0.51),
  medium: rgb(0.96, 0.62, 0.04),
  low: rgb(0.94, 0.27, 0.27),
  info: rgb(0.23, 0.51, 0.96),
  warning: rgb(0.96, 0.62, 0.04),
  critical: rgb(0.94, 0.27, 0.27),
};

export const DISTRIBUTION_META = [
  { key: 'high' as const, label: 'High (75+)', color: COLORS.high },
  { key: 'medium' as const, label: 'Medium (50-74)', color: COLORS.medium },
  { key: 'low' as const, label: 'Low (<50)', color: COLORS.low },
];

export function sanitizePdfText(text: string): string {
  return text
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

export type PdfDocumentBuilderOptions = {
  watermarked: boolean;
};

export type CandidatePdfMetadata = {
  email?: string | null;
  linkedinUrl?: string | null;
  githubUsername?: string | null;
  followUpSuggested?: string[] | null;
};

export type RolePdfStats = {
  avgIntegrity: number | null;
  scored: number;
  completedCount: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
};

export type ProgressDirection = 'higher' | 'lower';
