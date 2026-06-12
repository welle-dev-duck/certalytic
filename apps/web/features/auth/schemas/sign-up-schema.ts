import z from "zod";

export const signUpSchema = z
  .object({
    name: z.string().min(1),
    email: z.email().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignUpSchema = z.infer<typeof signUpSchema>;
