import type { Locale } from "@/lib/i18n/config";

import authDe from "@/messages/de/auth.json";
import appDe from "@/messages/de/app.json";
import commonDe from "@/messages/de/common.json";
import legalDe from "@/messages/de/legal.json";
import marketingDe from "@/messages/de/marketing.json";
import settingsDe from "@/messages/de/settings.json";
import authEn from "@/messages/en/auth.json";
import appEn from "@/messages/en/app.json";
import commonEn from "@/messages/en/common.json";
import legalEn from "@/messages/en/legal.json";
import marketingEn from "@/messages/en/marketing.json";
import settingsEn from "@/messages/en/settings.json";

export const namespaces = [
  "common",
  "auth",
  "marketing",
  "settings",
  "app",
  "legal",
] as const;

export type MessageNamespace = (typeof namespaces)[number];

const catalog: Record<
  Locale,
  Record<MessageNamespace, Record<string, unknown>>
> = {
  en: {
    common: commonEn,
    auth: authEn,
    marketing: marketingEn,
    settings: settingsEn,
    app: appEn,
    legal: legalEn,
  },
  de: {
    common: commonDe,
    auth: authDe,
    marketing: marketingDe,
    settings: settingsDe,
    app: appDe,
    legal: legalDe,
  },
};

export function getNamespaceMessages(
  locale: Locale,
  namespace: MessageNamespace,
): Record<string, unknown> {
  return catalog[locale][namespace];
}
