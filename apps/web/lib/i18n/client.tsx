"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE,
  localeCookieOptions,
  type Locale,
} from "@/lib/i18n/config";
import {
  getNamespaceMessages,
  type MessageNamespace,
} from "@/lib/i18n/messages";
import { createTranslator, type Translator } from "@/lib/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: Locale;
  children: ReactNode;
};

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const router = useRouter();

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;

      const { path, maxAge, sameSite } = localeCookieOptions();
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}`;
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export function useTranslations(namespace: MessageNamespace): Translator {
  const { locale } = useI18n();

  return useMemo(
    () =>
      createTranslator(getNamespaceMessages(locale, namespace)),
    [locale, namespace],
  );
}
