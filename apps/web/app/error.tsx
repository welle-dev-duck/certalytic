"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPageContent } from "@/components/error-page-content";
import { useTranslations } from "@/lib/i18n/client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("common");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ErrorPageContent
      eyebrow={t("error.eyebrow")}
      title={t("error.title")}
      description={t("error.description")}
      retryLabel={t("error.retry")}
      homeLabel={t("error.home")}
      onRetry={reset}
    />
  );
}
