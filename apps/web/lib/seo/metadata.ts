import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/config";

import { getSiteUrl, SITE_NAME } from "./site";

type CreatePageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  index?: boolean;
  locale?: Locale;
  absoluteTitle?: boolean;
};

export function createRootMetadata(input: {
  description: string;
  locale: Locale;
}): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description: input.description,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: input.locale === "de" ? "de_DE" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
    },
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    },
  };
}

export function createPageMetadata(input: CreatePageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = input.path ? `${siteUrl}${input.path}` : undefined;
  const title = input.absoluteTitle
    ? { absolute: input.title }
    : input.title;

  const openGraphTitle =
    typeof title === "string"
      ? input.absoluteTitle
        ? input.title
        : `${input.title} · ${SITE_NAME}`
      : input.title;

  return {
    title,
    description: input.description,
    alternates: canonical ? { canonical } : undefined,
    robots:
      input.index === false
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      title: openGraphTitle,
      description: input.description,
      url: canonical,
      locale: input.locale === "de" ? "de_DE" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: openGraphTitle,
      description: input.description,
    },
  };
}
