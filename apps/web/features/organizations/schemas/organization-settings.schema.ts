import { z } from "zod";

import {
  isValidCountryCode,
  ORGANIZATION_COUNTRY_DEFAULT,
} from "@/lib/i18n/countries";
import {
  isOrganizationLanguage,
  ORGANIZATION_LANGUAGE_DEFAULT,
} from "@/lib/i18n/organization-language";
import type { Translator } from "@/lib/i18n/translate";

export type OrganizationValues = {
  name: string;
  country: string;
  language: "en" | "de";
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
    country: z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .refine(
        (value) => isValidCountryCode(value),
        t("organizationPage.validation.countryInvalid"),
      ),
    language: z
      .string()
      .trim()
      .refine(
        (value) => isOrganizationLanguage(value),
        t("organizationPage.validation.languageInvalid"),
      ),
  });
}

export function createOrganizationFormSchema(t: Translator) {
  return createOrganizationSettingsSchema(t);
}

export function resolveOrganizationFormValues(input: {
  name: string;
  country?: string | null;
  language?: string | null;
}): OrganizationValues {
  return {
    name: input.name,
    country: isValidCountryCode(input.country ?? "")
      ? (input.country ?? ORGANIZATION_COUNTRY_DEFAULT).toLowerCase()
      : ORGANIZATION_COUNTRY_DEFAULT,
    language: isOrganizationLanguage(input.language)
      ? input.language
      : ORGANIZATION_LANGUAGE_DEFAULT,
  };
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
