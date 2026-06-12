export type CandidateRound = {
    id: number;
    round_number: number;
    was_truncated: boolean;
    variance_delta: string | number | null;
    round_scores: Record<string, unknown> | null;
    deep_dive_prompts: string[] | null;
};

export type Candidate = {
    id: number;
    name: string;
    role: string | null;
    role_id: number | null;
    job_role_title?: string | null;
    email: string | null;
    status: string;
    integrity_score: string | number | null;
    rounds_count?: number;
    high_inconsistency_warning: boolean;
    processed_at: string | null;
    error_message: string | null;
    linkedin_url: string | null;
    github_username: string | null;
    rounds: CandidateRound[];
    score_breakdown?: Record<string, unknown> | null;
    follow_up_suggested?: string[] | null;
};

export type TokenUsage = {
    plan: string;
    plan_label: string;
    included_quota: number;
    included_used: number;
    included_remaining: number;
    pack_balance: number;
    available: number;
};
