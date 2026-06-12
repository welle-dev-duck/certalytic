import { Link, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    Building2,
    Check,
    ChevronDown,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Mic,
    Settings,
    ShieldCheck,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import CreateTeamModal from '@/components/create-team-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';
import { switchMethod } from '@/routes/teams';
import type { AppLayoutProps } from '@/types';
import type { TokenUsage } from '@/types/candidates';
import { cn } from '@/lib/utils';

type NavItem = {
    label: string;
    icon: LucideIcon;
    href: string;
    match: string;
};

function buildNav(teamSlug: string | undefined, canSavedRoles: boolean): NavItem[] {
    const base = teamSlug ? `/${teamSlug}` : '';

    return [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: `${base}/dashboard`,
            match: '/dashboard',
        },
        ...(canSavedRoles
            ? [
                  {
                      label: 'Roles',
                      icon: Briefcase,
                      href: `${base}/roles`,
                      match: '/roles',
                  },
              ]
            : []),
        {
            label: 'Candidates',
            icon: Users,
            href: `${base}/candidates`,
            match: '/candidates',
        },
        {
            label: 'Tools',
            icon: Mic,
            href: `${base}/tools/transcription`,
            match: '/tools',
        },
        {
            label: 'Billing',
            icon: CreditCard,
            href: `${base}/billing`,
            match: '/billing',
        },
        {
            label: 'Settings',
            icon: Settings,
            href: '/settings/organization',
            match: '/settings/organization',
        },
    ];
}

function tokenBarClass(pct: number): string {
    if (pct > 0.85) {
        return 'bg-destructive';
    }

    if (pct > 0.65) {
        return 'bg-chart-3';
    }

    return 'bg-primary';
}

function CertalyticSidebar() {
    const page = usePage();
    const { auth, currentTeam, teams, canSavedRoles, tokenUsage, canCreateTeam } =
        page.props as {
            auth: { user: { name: string } };
            currentTeam?: { id: number; name: string; slug: string };
            teams?: { id: number; name: string; slug: string }[];
            canSavedRoles?: boolean;
            tokenUsage?: TokenUsage | null;
            canCreateTeam?: boolean;
        };
    const teamSlug = currentTeam?.slug;
    const currentUrl = page.url;

    const navItems = buildNav(teamSlug, canSavedRoles === true);

    const usage = tokenUsage;
    const tokenUsed = usage?.included_used ?? 0;
    const tokenQuota = usage?.included_quota ?? 0;
    const tokenPct = tokenQuota > 0 ? tokenUsed / tokenQuota : 0;
    const planLabel = usage?.plan_label ?? 'Free';

    const userInitials = auth.user.name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const activeTeamName = currentTeam?.name ?? 'Personal Workspace';
    const otherTeams = (teams ?? []).filter((t) => t.id !== currentTeam?.id);

    function switchTeam(slug: string) {
        if (slug === teamSlug) {
            return;
        }

        const previousTeamSlug = teamSlug;

        router.visit(switchMethod(slug), {
            onFinish: () => {
                if (!previousTeamSlug || typeof window === 'undefined') {
                    router.reload();

                    return;
                }

                const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
                const segment = `/${previousTeamSlug}`;

                if (currentUrl.includes(segment)) {
                    router.visit(
                        currentUrl.replace(segment, `/${slug}`),
                        { replace: true },
                    );

                    return;
                }

                router.reload();
            },
        });
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
                        {currentTeam && (
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 focus:bg-sidebar-accent/80"
                                onSelect={() => switchTeam(currentTeam.slug)}
                            >
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-chart-2/15 text-[9px] font-bold text-chart-2">
                                    {currentTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="min-w-0 flex-1 truncate">
                                    {currentTeam.name}
                                </span>
                                <Check size={11} className="text-sidebar-primary" />
                            </DropdownMenuItem>
                        )}
                        {otherTeams.map((team) => (
                            <DropdownMenuItem
                                key={team.id}
                                className="cursor-pointer gap-2 focus:bg-sidebar-accent/80"
                                onSelect={() => switchTeam(team.slug)}
                            >
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-chart-2/15 text-[9px] font-bold text-chart-2">
                                    {team.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="min-w-0 flex-1 truncate">
                                    {team.name}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-sidebar-border" />
                        <div className="p-1">
                            {canCreateTeam === false ? (
                                <p className="px-2 py-1.5 text-center text-[10px] text-sidebar-foreground/60">
                                    Team limit reached
                                </p>
                            ) : (
                                <CreateTeamModal>
                                    <button
                                        type="button"
                                        className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1.5 text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80"
                                    >
                                        <Building2 size={12} />
                                        Create Team
                                    </button>
                                </CreateTeamModal>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1 md:p-2">
                {navItems.map(({ href, icon: Icon, label, match }) => {
                    const active = currentUrl.includes(match);

                    return (
                        <Link
                            key={label}
                            href={href}
                            title={label}
                            className={cn(
                                'flex items-center justify-center gap-2.5 rounded-md border-l-2 px-2 py-2 text-sm font-medium transition-all duration-150 md:justify-start md:px-3',
                                active
                                    ? 'border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary'
                                    : 'border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground',
                            )}
                        >
                            <Icon size={15} className="shrink-0" />
                            <span className="hidden md:inline">{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="space-y-2 border-t border-sidebar-border p-2 md:p-3">
                {usage && tokenQuota > 0 && (
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
                                <span className="text-sidebar-foreground/60">
                                    /{tokenQuota}
                                </span>
                            </span>
                        </div>
                        <div className="mb-1 h-1 overflow-hidden rounded-full bg-sidebar-border">
                            <div
                                className={cn('h-full rounded-full', tokenBarClass(tokenPct))}
                                style={{ width: `${Math.round(tokenPct * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-sidebar-foreground/60">
                            {usage.included_remaining} included left
                            {usage.pack_balance > 0 && ` · +${usage.pack_balance} pack`}
                        </p>
                    </div>
                )}

                <div className="flex flex-col items-center gap-1 md:flex-row">
                    <Link
                        href={editProfile()}
                        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-sidebar-accent md:justify-start"
                        title="Your personal settings"
                    >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sidebar-primary/25 bg-sidebar-primary/15 text-[10px] font-bold text-sidebar-primary">
                            {userInitials}
                        </div>
                        <div className="hidden min-w-0 flex-1 md:block">
                            <p className="truncate text-xs leading-none font-semibold text-sidebar-foreground">
                                {auth.user.name}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] leading-none text-sidebar-foreground/60">
                                Your settings
                            </p>
                        </div>
                    </Link>
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        title="Sign out"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent"
                    >
                        <LogOut size={14} />
                    </Link>
                </div>
            </div>
        </aside>
    );
}

export default function AppSidebarLayout({
    breadcrumbs = [],
    children,
}: PropsWithChildren<AppLayoutProps>) {
    return (
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-background">
            <CertalyticSidebar />
            <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain overscroll-x-none">
                <div className="mx-auto w-full max-w-full min-w-0">
                    {breadcrumbs.length > 0 && (
                        <div className="border-b border-border px-4 py-2 sm:px-6 sm:py-3">
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
