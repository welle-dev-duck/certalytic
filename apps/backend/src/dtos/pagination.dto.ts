import { z } from 'zod';

// TODO: remove option 1 before prod
export const PAGE_SIZES = [1, 10, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const cursorPaginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .refine((value): value is PageSize =>
      PAGE_SIZES.includes(value as PageSize),
    )
    .default(DEFAULT_PAGE_SIZE),
  cursor: z.uuid().optional(),
});

export type CursorPaginationQueryDto = z.infer<
  typeof cursorPaginationQuerySchema
>;

export const paginationMetaSchema = z.object({
  limit: z.number().int(),
  from: z.number().int().nullable(),
  to: z.number().int().nullable(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  nextCursor: z.uuid().nullable(),
});

export type PaginationMetaDto = z.infer<typeof paginationMetaSchema>;

export function createPaginatedResponseSchema<T extends z.ZodType>(
  itemSchema: T,
) {
  return z.object({
    data: z.array(itemSchema),
    pagination: paginationMetaSchema,
  });
}

/** @deprecated Use cursorPaginationQuerySchema */
export const paginationQuerySchema = cursorPaginationQuerySchema;

/** @deprecated Use CursorPaginationQueryDto */
export type PaginationQueryDto = CursorPaginationQueryDto;
