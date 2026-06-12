import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only",
    ),
});

export const inviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
});

export type OrganizationValues = z.infer<typeof organizationSchema>;
export type InviteValues = z.infer<typeof inviteSchema>;

export function formatOrganizationRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
