import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";
import { AuthTopBar } from "./auth-top-bar";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col bg-background font-sans text-foreground">
      <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-6">
        {/* <LocaleSwitcher className="w-40 shrink-0" /> */}
        <AuthTopBar />
      </header>

      <div className="flex flex-col items-center px-4 pt-2 sm:px-6">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          LOGO
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 sm:px-6">
        <div className="w-full max-w-104">{children}</div>
      </div>

      <footer className="px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        <p>
          <Link href="#" className="hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link href="#" className="hover:underline">
            Contact
          </Link>
        </p>
      </footer>
    </main>
  );
}
