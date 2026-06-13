import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getTranslations } from "@/lib/i18n/server";
import { routes } from "@/lib/routes";

import { createPageMetadata } from "./metadata";

type AuthMetadataPage =
  | "signIn"
  | "signUp"
  | "forgotPassword"
  | "resetPassword"
  | "verifyEmail";

type AppMetadataPage =
  | "dashboard"
  | "candidates"
  | "candidateDetail"
  | "candidatesCreate"
  | "candidatesImport"
  | "roles"
  | "roleDetail"
  | "billing"
  | "invitation";

type SettingsMetadataPage =
  | "profile"
  | "security"
  | "appearance"
  | "language"
  | "organization";

type LegalMetadataPage =
  | "privacy"
  | "terms"
  | "dpa"
  | "cookies"
  | "imprint";

const authPaths: Record<AuthMetadataPage, string> = {
  signIn: routes.signIn(),
  signUp: routes.signUp(),
  forgotPassword: routes.forgotPassword(),
  resetPassword: routes.resetPassword(),
  verifyEmail: routes.verifyEmail(),
};

const appPaths: Record<AppMetadataPage, string> = {
  dashboard: routes.dashboard(),
  candidates: routes.candidates(),
  candidateDetail: routes.candidates(),
  candidatesCreate: routes.candidates() + "/create",
  candidatesImport: routes.candidates() + "/import",
  roles: routes.roles(),
  roleDetail: routes.roles(),
  billing: routes.billing(),
  invitation: routes.invitation(),
};

const settingsPaths: Record<SettingsMetadataPage, string> = {
  profile: routes.settingsProfile(),
  security: routes.settingsSecurity(),
  appearance: routes.settingsAppearance(),
  language: routes.settingsLanguage(),
  organization: routes.settingsOrganization(),
};

const legalPaths: Record<LegalMetadataPage, string> = {
  privacy: routes.legal.privacy(),
  terms: routes.legal.terms(),
  dpa: routes.legal.dpa(),
  cookies: routes.legal.cookies(),
  imprint: routes.legal.imprint(),
};

async function withLocale(): Promise<Locale> {
  return getLocale();
}

export async function getMarketingHomeMetadata(): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("marketing");

  return createPageMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    path: routes.home(),
    locale,
    absoluteTitle: true,
  });
}

export async function getAuthPageMetadata(
  page: AuthMetadataPage,
): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("auth");

  return createPageMetadata({
    title: t(`metadata.${page}.title`),
    description: t(`metadata.${page}.description`),
    path: authPaths[page],
    locale,
    index: false,
  });
}

export async function getAppPageMetadata(
  page: AppMetadataPage,
  options?: { title?: string; description?: string },
): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("app");

  return createPageMetadata({
    title: options?.title ?? t(`metadata.${page}.title`),
    description: options?.description ?? t(`metadata.${page}.description`),
    path: appPaths[page],
    locale,
    index: false,
  });
}

export async function getSettingsPageMetadata(
  page: SettingsMetadataPage,
): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("settings");

  return createPageMetadata({
    title: t(`metadata.${page}.title`),
    description: t(`metadata.${page}.description`),
    path: settingsPaths[page],
    locale,
    index: false,
  });
}

export async function getLegalPageMetadata(
  page: LegalMetadataPage,
): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("legal");

  return createPageMetadata({
    title: t(`metadata.${page}.title`),
    description: t(`metadata.${page}.description`),
    path: legalPaths[page],
    locale,
  });
}

export async function getErrorPageMetadata(): Promise<Metadata> {
  const locale = await withLocale();
  const t = await getTranslations("common");

  return createPageMetadata({
    title: t("error.metadataTitle"),
    description: t("error.metadataDescription"),
    locale,
    index: false,
  });
}
