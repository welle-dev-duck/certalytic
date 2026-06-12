"use client";

import { Scale } from "lucide-react";
import Link from "@/components/ui/link";

import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth-provider";

export function MarketingHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border border-primary bg-primary/10">
            <Scale size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold tracking-wide">{COMPANY.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#how-it-works" className="hover:text-foreground">
            How it works
          </a>
          <a href="/#product" className="hover:text-foreground">
            Product
          </a>
          <a href="/#demo" className="hover:text-foreground">
            Demo
          </a>
          <a href="/#pricing" className="hover:text-foreground">
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button size="sm" asChild>
              <Link href={routes.dashboard()}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={routes.signIn()}>Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={routes.signUp()}>Start free</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
