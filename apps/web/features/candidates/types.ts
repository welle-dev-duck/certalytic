import type { Flag, IntegrityLevel } from "@/lib/integrity";

export type CandidateStatus = "pending" | "processing" | "complete" | "failed";

export type CandidateListItem = {
  id: string;
  name: string;
  email: string | null;
  roleId: string | null;
  roleTitle: string | null;
  status: CandidateStatus;
  integrityScore: number | null;
  roundsCount: number;
  highInconsistencyWarning: boolean;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    lastPage: number;
    from: number | null;
    to: number | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type CandidateDetail = CandidateListItem & {
  linkedinUrl: string | null;
  githubUsername: string | null;
  scoreBreakdown: Record<string, unknown> | null;
  followUpSuggested: string[] | null;
  rounds: Array<{
    id: string;
    roundNumber: number;
    wasTruncated: boolean;
    varianceDelta: number | null;
    deepDivePrompts: string[] | null;
    roundScores: Record<string, unknown> | null;
  }>;
};

export type RadarPoint = { subject: string; value: number };
export type RiskVector = { name: string; value: number };

export type PlatformAnalysis = {
  provided: boolean;
  handle: string | null;
  status: "authentic" | "insufficient" | "not_provided";
  statusLabel: string;
};

export type PlatformMatrixRow = {
  score: number | null;
  explanation: string;
};

export type PlatformMatrix = {
  linkedin_cv_match: PlatformMatrixRow;
  github_experience_match: PlatformMatrixRow;
  cross_platform_consistency: PlatformMatrixRow;
};

export type SupplementaryAnalysis = {
  summary: string;
  traits: string[];
  detailLabel: string;
  detail: string;
  indicators: string[];
  motivationSignals: string[];
  concerns: string[];
};

export type CandidateReport = {
  score: number;
  level: IntegrityLevel;
  subScores: {
    s_cv: number;
    s_int: number;
    s_cross: number | null;
    s_id: number;
  };
  crossSourceEvaluated: boolean;
  componentSummaries: {
    s_cv: string;
    s_int: string;
    s_cross: string;
    s_id: string;
  };
  componentIndicators: {
    s_cv: string[];
    s_int: string[];
    s_cross: string[];
    s_id: string[];
  };
  aiTextPercent: number;
  platformConsistency: number | null;
  platformMatrix: PlatformMatrix;
  interviewVariance: number;
  responseScore: number;
  radar: RadarPoint[];
  riskVectors: RiskVector[];
  flags: Flag[];
  linkedin: PlatformAnalysis;
  github: PlatformAnalysis;
  verdict: { level: IntegrityLevel; title: string; body: string };
  recommendedActions: string[];
  rounds: Array<{
    roundNumber: number;
    sInt: number | null;
    sId: number | null;
    varianceDelta: number | null;
    wasTruncated: boolean;
    observations: string[];
    deepDivePrompts: string[];
  }>;
  behaviourAnalysis: SupplementaryAnalysis;
  personalityAnalysis: SupplementaryAnalysis;
};
