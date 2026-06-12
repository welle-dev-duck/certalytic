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
  const total = data.length;

  return {
    data,
    pagination: {
      limit,
      page: 1,
      total,
      lastPage: hasNextPage ? 2 : 1,
      from: total > 0 ? 1 : null,
      to: total > 0 ? total : null,
      hasNextPage,
      hasPrevPage: false,
      nextCursor: hasNextPage && lastItem ? lastItem.id : null,
    },
  };
}

export function paginateByPage<T>(
  rows: T[],
  total: number,
  page: number,
  limit: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), lastPage);
  const from = total === 0 ? null : (safePage - 1) * limit + 1;
  const to = total === 0 ? null : from! + rows.length - 1;

  return {
    data: rows,
    pagination: {
      limit,
      page: safePage,
      total,
      lastPage,
      from,
      to,
      hasNextPage: safePage < lastPage,
      hasPrevPage: safePage > 1,
      nextCursor: null,
    },
  };
}
