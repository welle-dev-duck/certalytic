import type { Locale } from "@/lib/i18n/config";
import type { MessageTree } from "@/lib/i18n/translate";

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
  Record<MessageNamespace, MessageTree>
> = {
  en: {
    common: commonEn as MessageTree,
    auth: authEn as MessageTree,
    marketing: marketingEn as MessageTree,
    settings: settingsEn as MessageTree,
    app: appEn as MessageTree,
    legal: legalEn as MessageTree,
  },
  de: {
    common: commonDe as MessageTree,
    auth: authDe as MessageTree,
    marketing: marketingDe as MessageTree,
    settings: settingsDe as MessageTree,
    app: appDe as MessageTree,
    legal: legalDe as MessageTree,
  },
};

export function getNamespaceMessages(
  locale: Locale,
  namespace: MessageNamespace,
): MessageTree {
  return catalog[locale][namespace];
}
