import type { Metadata } from "next";
import {
  Fira_Code,
  Hanken_Grotesk,
  Newsreader,
} from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
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

export const metadata: Metadata = {
  title: "Certalytic",
  description:
    "EU-sovereign hiring integrity screening — cross-check CVs, transcripts, and public profiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <QueryProvider>
            <TooltipProvider>
              <AuthProvider>
                <RealtimeProvider>{children}</RealtimeProvider>
              </AuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
