export type RoleDocument = {
    id: number;
    original_name: string;
    ocr_status: string;
};

export type RoleListItem = {
    id: number;
    title: string;
    description: string | null;
    context_metadata: Record<string, unknown> | null;
    candidates_count: number;
    avg_integrity: number | null;
    created_at: string;
};

export type JobRole = {
    id: number;
    title: string;
    description: string | null;
    context_metadata: Record<string, unknown> | null;
    candidates_count: number;
    documents: RoleDocument[];
    created_at: string;
};

export type RoleCandidate = {
    id: number;
    name: string;
    email: string | null;
    status: string;
    integrity_score: string | number | null;
    rounds_count: number;
    processed_at: string | null;
};
