export type RoleListItem = {
  id: string;
  title: string;
  description: string | null;
  contextMetadata: Record<string, unknown> | null;
  candidatesCount: number;
  avgIntegrity: number | null;
  createdAt: string;
};

export type RoleStats = {
  avgIntegrity: number | null;
  scored: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
};

export type RoleDetail = RoleListItem & {
  stats: RoleStats;
  documents: Array<{
    id: string;
    originalName: string;
    ocrStatus: string;
    sortOrder: number;
  }>;
};

export type RoleExportSummary = {
  id: string;
  status: "pending" | "processing" | "complete" | "failed";
  errorMessage: string | null;
  completedAt: string | null;
  downloadUrl: string | null;
};

export type { Paginated } from "@/lib/pagination";
