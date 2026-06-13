import type { Metadata } from "next";
import {
  Fira_Code,
  Hanken_Grotesk,
  Newsreader,
} from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";
import { SystemMessageBanner } from "@/components/system-message-banner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { createRootMetadata } from "@/lib/seo/metadata";
import { getNamespaceMessages } from "@/lib/i18n/messages";
import { createTranslator } from "@/lib/i18n/translate";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { RealtimeProvider } from "@/providers/realtime-provider";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = createTranslator(getNamespaceMessages(locale, "common"));

  return createRootMetadata({
    description: t("metadata.description"),
    locale,
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const systemMessageBannerText =
    process.env.SYSTEM_MESSAGE_BANNER_TEXT?.trim() ?? "";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        hankenGrotesk.variable,
        newsreader.variable,
        firaCode.variable,
        "h-full",
      )}
    >
      <body
        className={cn(
          "h-full font-sans antialiased",
          systemMessageBannerText && "pt-11",
        )}
      >
        {systemMessageBannerText ? (
          <SystemMessageBanner text={systemMessageBannerText} />
        ) : null}
        <ThemeProvider>
          <QueryProvider>
            <I18nProvider locale={locale}>
              <TooltipProvider>
                <AuthProvider>
                  <RealtimeProvider>{children}</RealtimeProvider>
                </AuthProvider>
              </TooltipProvider>
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
