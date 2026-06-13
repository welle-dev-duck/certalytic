"use client";

import {
  Fira_Code,
  Hanken_Grotesk,
  Newsreader,
} from "next/font/google";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorPageContent } from "@/components/error-page-content";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira",
  display: "swap",
});

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        hankenGrotesk.variable,
        newsreader.variable,
        firaCode.variable,
        "h-full",
      )}
    >
      <body className="h-full font-sans antialiased">
        <ThemeProvider>
          <ErrorPageContent
            eyebrow="Error"
            title="Something went wrong"
            description="We hit an unexpected problem. Try again, or return home if the issue persists."
            retryLabel="Try again"
            homeLabel="Back to home"
            onRetry={reset}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
