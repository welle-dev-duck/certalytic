import { z } from 'zod';

// TODO: remove option 1 before prod
export const PAGE_SIZES = [1, 10, 25, 50, 100] as const;

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
  page: z.coerce.number().int().min(1).default(1),
  cursor: z.uuid().optional(),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  limit: z.number().int(),
  page: z.number().int(),
  total: z.number().int(),
  lastPage: z.number().int(),
  from: z.number().int().nullable(),
  to: z.number().int().nullable(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  nextCursor: z.uuid().nullable().optional(),
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
