import { usePage } from '@inertiajs/react';
import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, currentTeam } = usePage().props;
    const getInitials = useInitials();
    const pageTitle = breadcrumbs.at(-1)?.title;
    const showAvatar = Boolean(auth.user.avatar && auth.user.avatar !== '');

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-bright px-4 md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground md:hidden" />
                <div className="relative hidden max-w-xl flex-1 md:block">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder={
                            pageTitle
                                ? `Search ${pageTitle.toLowerCase()}...`
                                : 'Search candidates, roles, or scores...'
                        }
                        className="w-full rounded-lg border-0 bg-surface-container-low py-2 pr-4 pl-10 text-body-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="relative text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Notifications"
                >
                    <Bell className="size-5" />
                    <span className="absolute top-0 right-0 size-2 rounded-full bg-destructive" />
                </button>
                <div className="hidden items-center gap-3 border-l border-border pl-4 sm:flex">
                    <div className="text-right">
                        <p className="text-label-md font-semibold tracking-widest text-primary uppercase">
                            {auth.user.name}
                        </p>
                        <p className="text-[10px] tracking-tight text-muted-foreground uppercase">
                            {currentTeam?.name ?? 'No team'}
                        </p>
                    </div>
                    <Avatar className="size-9 overflow-hidden rounded-lg">
                        {showAvatar ? (
                            <AvatarImage
                                src={auth.user.avatar}
                                alt={auth.user.name}
                            />
                        ) : null}
                        <AvatarFallback className="rounded-lg">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
