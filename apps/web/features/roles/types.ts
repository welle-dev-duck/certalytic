export type RoleListItem = {
  id: string;
  title: string;
  description: string | null;
  contextMetadata: Record<string, unknown> | null;
  candidatesCount: number;
  avgIntegrity: number | null;
  createdAt: string;
};

export type RoleDetail = RoleListItem & {
  documents: Array<{
    id: string;
    originalName: string;
    ocrStatus: string;
    sortOrder: number;
  }>;
};

export type PaginatedRoles<T> = {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};
