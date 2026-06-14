import posthog from "posthog-js";

export const AnalyticsEvents = {
  screeningCreated: "screening_created",
  roleCreated: "role_created",
  candidatePdfExported: "candidate_pdf_exported",
  rolePdfExported: "role_pdf_exported",
  marketingCtaClicked: "marketing_cta_clicked",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function getPostHogProjectKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  );
}

export function initPostHog(): void {
  const key = getPostHogProjectKey();
  if (!key || typeof window === "undefined" || posthog.__loaded) return;

  posthog.init(key, {
    api_host: "/ingest",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
}

export function captureEvent(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
): void {
  if (typeof window === "undefined" || !posthog.__loaded) return;
  posthog.capture(event, properties);
}

export function captureMarketingCta(
  location: string,
  label?: string,
): void {
  captureEvent(AnalyticsEvents.marketingCtaClicked, {
    location,
    label,
  });
}
