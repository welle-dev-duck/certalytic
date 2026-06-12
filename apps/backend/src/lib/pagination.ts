import type { Request } from 'express';

import {
  DEFAULT_PAGE_SIZE,
  paginationQuerySchema,
  type PaginationMetaDto,
  type PaginationQueryDto,
} from '../dtos/pagination.dto';

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMetaDto;
};

export function parsePaginationQuery(req: Request): PaginationQueryDto {
  return paginationQuerySchema.parse(req.query);
}

export function paginateByCursor<T extends { id: string }>(
  rows: T[],
  limit: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  const hasNextPage = rows.length > limit;
  const data = hasNextPage ? rows.slice(0, limit) : rows;
  const lastItem = data.at(-1);

  return {
    data,
    pagination: {
      limit,
      nextCursor: hasNextPage && lastItem ? lastItem.id : null,
      hasNextPage,
    },
  };
}
