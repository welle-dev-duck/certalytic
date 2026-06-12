import { z } from 'zod';

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 25;

export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .refine((value): value is PageSize =>
      PAGE_SIZES.includes(value as PageSize),
    )
    .default(DEFAULT_PAGE_SIZE),
  cursor: z.uuid().optional(),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  limit: z.number().int(),
  nextCursor: z.uuid().nullable(),
  hasNextPage: z.boolean(),
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
