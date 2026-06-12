import { z } from 'zod';

export const emailUserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  })
  .passthrough();

export type EmailUserDto = z.infer<typeof emailUserSchema>;
