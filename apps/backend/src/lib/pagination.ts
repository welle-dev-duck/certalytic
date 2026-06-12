import {
  DEFAULT_PAGE_SIZE,
  type PaginationMetaDto,
} from '../dtos/pagination.dto';

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMetaDto;
};

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
      from: total > 0 ? 1 : null,
      to: total > 0 ? total : null,
      hasNextPage,
      hasPrevPage: false,
      nextCursor: hasNextPage && lastItem ? lastItem.id : null,
    },
  };
}
