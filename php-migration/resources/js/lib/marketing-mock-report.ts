import type { CandidateReport } from '@/lib/candidate-report';

export const marketingMockReport: CandidateReport = {
    score: 62.4,
    level: 'medium',
    subScores: {
        s_cv: 74,
        s_int: 58,
        s_cross: 51,
        s_id: 82,
    },
    componentSummaries: {
        s_cv: 'Timeline is mostly coherent with one overlapping contract period that warrants clarification.',
        s_int: 'Round-two answers showed rehearsed phrasing and uneven depth on production debugging questions.',
        s_cross: 'LinkedIn tenure for a senior role is shorter than the CV claims by approximately nine months.',
        s_id: 'Identity signals are consistent across CV, transcript names, and public profile handles.',
    },
    componentIndicators: {
        s_cv: ['Stable employer sequence', 'One overlapping date range'],
        s_int: ['Latency spikes on system design', 'Generic architecture vocabulary'],
        s_cross: ['LinkedIn role duration mismatch', 'GitHub activity sparse in claimed period'],
        s_id: ['Email domain matches employer', 'Name consistent across sources'],
    },
    aiTextPercent: 34,
    crossSourceEvaluated: true,
    platformConsistency: 51,
    platformMatrix: {
        linkedin_cv_match: {
            score: 48,
            explanation: 'Senior title claimed on CV predates LinkedIn role start date.',
        },
        github_experience_match: {
            score: 55,
            explanation: 'Commit frequency low during claimed intensive backend period.',
        },
        cross_platform_consistency: {
            score: 50,
            explanation: 'Public profiles align on identity but diverge on tenure depth.',
        },
    },
    interviewVariance: 22,
    responseScore: 58,
    radar: [
        { subject: 'CV', value: 74 },
        { subject: 'Interview', value: 58 },
        { subject: 'Cross-ref', value: 51 },
        { subject: 'Identity', value: 82 },
        { subject: 'Consistency', value: 55 },
    ],
    riskVectors: [
        { name: 'Rehearsed answers', value: 68 },
        { name: 'Platform gap', value: 52 },
        { name: 'Latency risk', value: 61 },
    ],
    flags: [
        {
            type: 'platform_mismatch',
            severity: 'warning',
            description:
                'LinkedIn shows Backend Engineer from Mar 2021; CV lists Senior Backend Engineer from Jun 2020 at the same company.',
            confidence: 0.87,
        },
        {
            type: 'response_latency',
            severity: 'warning',
            description:
                'Round 2 system design answers included 12–18s pauses before structured responses on failure-mode questions.',
            confidence: 0.79,
        },
        {
            type: 'interview_prompt',
            severity: 'info',
            description:
                'Repeated use of textbook microservice patterns without project-specific trade-offs when probed.',
            confidence: 0.71,
        },
    ],
    linkedin: {
        provided: true,
        handle: 'linkedin.com/in/alex-demo',
        status: 'authentic',
        statusLabel: 'Profile provided',
    },
    github: {
        provided: true,
        handle: 'alexdemo',
        status: 'authentic',
        statusLabel: 'Profile provided',
    },
    verdict: {
        level: 'medium',
        title: 'Elevated integrity risk - follow-up recommended',
        body: 'Signal density is mixed. Cross-source alignment and interview depth gaps suggest targeted follow-up before advancing.',
    },
    recommendedActions: [
        'Ask for a live whiteboard extension on the production incident described in round one.',
        'Verify senior title start date with HR reference check.',
        'Compare GitHub commit history window against claimed project ownership.',
    ],
    rounds: [
        {
            round_number: 1,
            s_int: 71,
            s_id: 85,
            variance_delta: null,
            was_truncated: false,
            observations: ['Strong on API fundamentals', 'Specific latency numbers cited'],
            deep_dive_prompts: ['Walk through the caching layer failure you mentioned.'],
        },
        {
            round_number: 2,
            s_int: 52,
            s_id: 80,
            variance_delta: 19,
            was_truncated: false,
            observations: ['Pivot to generic patterns under pressure', 'Long pauses before system design answers'],
            deep_dive_prompts: ['Draw the exact queue topology from your last project.'],
        },
    ],
    behaviourAnalysis: {
        summary:
            'Communication shifts from conversational in behavioural sections to highly structured prose in technical answers, suggesting uneven spontaneity across the interview loop.',
        traits: ['Direct communicator', 'Process-oriented under pressure'],
        detailLabel: 'Communication style',
        detail: 'Concise in behavioural answers, formal and textbook-like when discussing architecture.',
        indicators: [
            'References cross-functional stakeholders naturally',
            'Explains trade-offs with limited project-specific detail',
        ],
        motivationSignals: [],
        concerns: ['Defensive pivot when pressed on implementation specifics'],
    },
    personalityAnalysis: {
        summary:
            'Motivation signals point toward ownership-heavy backend roles with preference for predictable delivery over exploratory research.',
        traits: ['Pragmatic', 'Risk-aware', 'Detail-oriented'],
        detailLabel: 'Work style',
        detail: 'Prefers structured problem decomposition and explicit success criteria before committing to designs.',
        indicators: [
            'Comfortable in regulated, audit-heavy environments',
            'May need autonomy to avoid over-indexing on process',
        ],
        motivationSignals: [
            'Cites reliability and customer impact over title progression',
            'Responds positively to mission-driven product framing',
        ],
        concerns: [],
    },
};

export const marketingScoreBreakdown = {
    s_cv: {
        score: 74,
        summary: marketingMockReport.componentSummaries.s_cv,
        indicators: marketingMockReport.componentIndicators.s_cv,
        confidence_band: 'moderate-high',
    },
    s_int: {
        score: 58,
        summary: marketingMockReport.componentSummaries.s_int,
        indicators: marketingMockReport.componentIndicators.s_int,
        confidence_band: 'moderate',
    },
    s_cross: {
        score: 51,
        summary: marketingMockReport.componentSummaries.s_cross,
        indicators: marketingMockReport.componentIndicators.s_cross,
        confidence_band: 'moderate-low',
    },
    s_id: {
        score: 82,
        summary: marketingMockReport.componentSummaries.s_id,
        indicators: marketingMockReport.componentIndicators.s_id,
        confidence_band: 'moderate-high',
    },
};
