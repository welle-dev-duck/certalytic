import { Link, usePage } from '@inertiajs/react';
import { Briefcase, CreditCard, LayoutGrid, Mic, ScanLine } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import SidebarTokenBalance from '@/components/sidebar-token-balance';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as billingIndex } from '@/routes/billing';
import { index as rolesIndex } from '@/routes/roles';
import { index as candidatesIndex } from '@/routes/candidates';
import { index as toolsIndex } from '@/routes/tools';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const page = usePage<{ canSavedRoles?: boolean }>();
    const teamSlug = page.props.currentTeam?.slug;
    const canSavedRoles = page.props.canSavedRoles ?? false;
    const dashboardUrl = teamSlug ? dashboard(teamSlug) : '/';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
        ...(teamSlug
            ? [
                  {
                      title: 'Screenings',
                      href: candidatesIndex(teamSlug),
                      icon: ScanLine,
                  },
                  ...(canSavedRoles
                      ? [
                            {
                                title: 'Roles',
                                href: rolesIndex(teamSlug),
                                icon: Briefcase,
                            },
                        ]
                      : []),
                  {
                      title: 'Tools',
                      href: toolsIndex(teamSlug),
                      icon: Mic,
                  },
                  {
                      title: 'Billing',
                      href: billingIndex(teamSlug),
                      icon: CreditCard,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-r border-border bg-surface"
        >
            <SidebarHeader className="gap-4 px-4 py-6">
                <SidebarMenu>
                    <SidebarMenuItem className="px-2">
                        <Link href={dashboardUrl} prefetch className="block">
                            <h1 className="text-headline-md font-bold text-primary">
                                Certalytic
                            </h1>
                            <p className="text-body-sm text-muted-foreground">
                                Institutional Integrity
                            </p>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="gap-0 border-t border-border pt-4">
                <SidebarTokenBalance />
                <SidebarSeparator className="mx-0" />
                <div className="px-2 pt-2">
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
