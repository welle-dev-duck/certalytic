import z from "zod";

export type SignInSchema = z.infer<typeof signInSchema>;

export const signInSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(8),
});
