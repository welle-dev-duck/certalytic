"use client";

import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import Link from "@/components/ui/link"
import { usePathname, useRouter } from "next/navigation";

import { CreateTeamModal } from "@/components/layout/create-team-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: routes.dashboard(), match: "/dashboard" },
  { label: "Roles", icon: Briefcase, href: routes.roles(), match: "/roles" },
  { label: "Candidates", icon: Users, href: routes.candidates(), match: "/candidates" },
  { label: "Billing", icon: CreditCard, href: routes.billing(), match: "/billing" },
  { label: "Settings", icon: Settings, href: routes.settingsOrganization(), match: "/settings" },
] as const;

function tokenBarClass(pct: number): string {
  if (pct > 0.85) return "bg-destructive";
  if (pct > 0.65) return "bg-chart-3";
  return "bg-primary";
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    organizations,
    activeOrganization,
    switchOrganization,
  } = useAuth();
  const { data: usage } = useBillingUsage();

  const planLabel = usage?.planLabel ?? "Free";
  const planQuota = usage?.planQuota ?? 0;
  const planTokens = usage?.planTokens ?? 0;
  const refillTokens = usage?.refillTokens ?? 0;
  const tokenUsed =
    planQuota > 0 ? Math.max(0, planQuota - planTokens) : 0;
  const tokenPct = planQuota > 0 ? tokenUsed / planQuota : 0;

  const userInitials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  const activeTeamName = activeOrganization?.name ?? "Select organization";
  const otherOrgs = organizations.filter((o) => o.id !== activeOrganization?.id);

  async function handleSwitchOrg(organizationId: string) {
    if (organizationId === activeOrganization?.id) return;
    await switchOrganization(organizationId);
    router.refresh();
  }

  async function handleSignOut() {
    await authClient.signOut();
    router.replace(routes.signIn());
  }

  return (
    <aside className="relative flex h-full w-14 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:w-56">
      <div className="flex items-center justify-center gap-2.5 border-b border-sidebar-border px-2 py-4 md:justify-start md:px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-sidebar-primary/30 bg-sidebar-primary/15">
          <ShieldCheck size={14} className="text-sidebar-primary" />
        </div>
        <p className="hidden text-sm leading-none font-bold tracking-tight text-sidebar-foreground md:block">
          Certalytic
        </p>
      </div>

      <div className="border-b border-sidebar-border px-1 py-2 md:px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={activeTeamName}
              className="flex w-full items-center justify-center gap-2 rounded-md px-1 py-2 transition-colors hover:bg-sidebar-accent md:justify-start md:px-2.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-chart-2/20 text-[10px] font-bold text-chart-2">
                {activeTeamName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden min-w-0 flex-1 text-left md:block">
                <p className="truncate text-xs leading-none font-semibold text-sidebar-foreground">
                  {activeTeamName}
                </p>
                <p className="mt-0.5 text-[10px] leading-none text-sidebar-foreground/60">
                  {planLabel} Plan
                </p>
              </div>
              <ChevronDown
                size={13}
                className="hidden shrink-0 text-sidebar-foreground/60 md:block"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            className="w-48 border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
          >
            {activeOrganization && (
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-sidebar-accent/80"
                onSelect={() => handleSwitchOrg(activeOrganization.id)}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-chart-2/15 text-[9px] font-bold text-chart-2">
                  {activeOrganization.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate">
                  {activeOrganization.name}
                </span>
                <Check size={11} className="text-sidebar-primary" />
              </DropdownMenuItem>
            )}
            {otherOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="cursor-pointer gap-2 focus:bg-sidebar-accent/80"
                onSelect={() => handleSwitchOrg(org.id)}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-chart-2/15 text-[9px] font-bold text-chart-2">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="min-w-0 flex-1 truncate">{org.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <div className="p-1">
              <CreateTeamModal canCreateTeam={organizations.length < 5}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80"
                >
                  <Building2 size={12} />
                  Create organization
                </button>
              </CreateTeamModal>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1 md:p-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, match }) => {
          const active = pathname === match || pathname.startsWith(`${match}/`);

          return (
            <Link
              key={label}
              href={href}
              title={label}
              className={cn(
                "flex items-center justify-center gap-2.5 rounded-md border-l-2 px-2 py-2 text-sm font-medium transition-all duration-150 md:justify-start md:px-3",
                active
                  ? "border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
                  : "border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon size={15} className="shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-2 md:p-3">
        {usage && planQuota > 0 && (
          <div className="hidden rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-2.5 md:block">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={10} className="text-sidebar-primary" />
                <span className="text-[10px] font-bold tracking-widest text-sidebar-foreground/60">
                  TOKENS
                </span>
              </div>
              <span className="font-mono text-[10px] font-semibold text-sidebar-foreground">
                {tokenUsed}
                <span className="text-sidebar-foreground/60">/{planQuota}</span>
              </span>
            </div>
            <div className="mb-1 h-1 overflow-hidden rounded-full bg-sidebar-border">
              <div
                className={cn("h-full rounded-full", tokenBarClass(tokenPct))}
                style={{ width: `${Math.round(tokenPct * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-sidebar-foreground/60">
              {planTokens} included left
              {refillTokens > 0 && ` · +${refillTokens} pack`}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 md:flex-row">
          <Link
            href={routes.settingsProfile()}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-sidebar-accent md:justify-start"
            title="Your personal settings"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sidebar-primary/25 bg-sidebar-primary/15 text-[10px] font-bold text-sidebar-primary">
              {userInitials}
            </div>
            <div className="hidden min-w-0 flex-1 md:block">
              <p className="truncate text-xs leading-none font-semibold text-sidebar-foreground">
                {user?.name}
              </p>
              <p className="mt-0.5 truncate text-[10px] leading-none text-sidebar-foreground/60">
                Your settings
              </p>
            </div>
          </Link>
          <button
            type="button"
            title="Sign out"
            onClick={handleSignOut}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
