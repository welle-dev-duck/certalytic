export type IntegrityLevel = 'high' | 'medium' | 'low';

export type FlagType =
    | 'ai_text'
    | 'synthetic_profile'
    | 'interview_prompt'
    | 'credential_gap'
    | 'platform_mismatch'
    | 'insufficient_signal'
    | 'response_latency';

export type FlagSeverity = 'critical' | 'warning' | 'info';

export interface Flag {
    type: FlagType;
    severity: FlagSeverity;
    description: string;
    confidence: number;
}

export function getIntegrityLevel(score: number): IntegrityLevel {
    if (score >= 75) {
        return 'high';
    }

    if (score >= 50) {
        return 'medium';
    }

    return 'low';
}

export function getIntegrityColor(level: IntegrityLevel): string {
    if (level === 'high') {
        return '#10B981';
    }

    if (level === 'medium') {
        return '#F59E0B';
    }

    return '#EF4444';
}

export function getScoreColor(score: number): string {
    if (score >= 75) {
        return '#10B981';
    }

    if (score >= 50) {
        return '#F59E0B';
    }

    return '#EF4444';
}
