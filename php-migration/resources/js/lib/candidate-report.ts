import type { Flag, IntegrityLevel } from '@/lib/integrity';

/**
 * Shape of the integrity report produced by `App\Services\CandidateReport`
 * (PHP). The backend is the single source of truth; these types just describe
 * the JSON delivered to the screening-details page.
 */

export type RadarPoint = { subject: string; value: number };
export type RiskVector = { name: string; value: number };

export type PlatformAnalysis = {
    provided: boolean;
    handle: string | null;
    status: 'authentic' | 'insufficient' | 'not_provided';
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

export type RoundInsight = {
    round_number: number;
    s_int: number | null;
    s_id: number | null;
    variance_delta: number | null;
    was_truncated: boolean;
    observations: string[];
    deep_dive_prompts: string[];
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
    rounds: RoundInsight[];
    behaviourAnalysis: SupplementaryAnalysis;
    personalityAnalysis: SupplementaryAnalysis;
};
