import { z } from "zod";

import type { Translator } from "@/lib/i18n/translate";

export type OrganizationValues = {
  name: string;
};

export type InviteValues = {
  email: string;
  role: "member" | "admin";
};

export function createOrganizationSettingsSchema(t: Translator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("organizationPage.validation.nameRequired"))
      .max(100),
  });
}

export function createInviteSchema(t: Translator) {
  return z.object({
    email: z
      .string()
      .trim()
      .email(t("organizationPage.validation.emailInvalid")),
    role: z.enum(["member", "admin"]),
  });
}

export function formatOrganizationRole(t: Translator, role: string): string {
  if (role === "member" || role === "admin") {
    return t(`organizationPage.roles.${role}`);
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}
