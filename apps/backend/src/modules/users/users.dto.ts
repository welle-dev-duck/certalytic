import { z } from 'zod';

export const sessionResponseSchema = z.object({
  session: z.unknown().nullable(),
});

export type SessionResponseDto = z.infer<typeof sessionResponseSchema>;
