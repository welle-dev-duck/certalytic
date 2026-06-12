export type PaginationMeta = {
  limit: number;
  from: number | null;
  to: number | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor: string | null;
};

export type Paginated<T> = {
  data: T[];
  pagination: PaginationMeta;
};
