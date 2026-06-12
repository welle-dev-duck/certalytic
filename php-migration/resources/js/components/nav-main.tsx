import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu className="space-y-1">
                {items.map((item) => {
                    const isActive = isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={cn(
                                    'h-auto rounded-none px-3 py-2 transition-colors',
                                    isActive
                                        ? 'border-r-2 border-primary bg-surface-container-low font-bold text-primary hover:bg-surface-container-low'
                                        : 'text-muted-foreground hover:bg-surface-container-low hover:text-foreground',
                                )}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className="size-5" />}
                                    <span className="text-body-md">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
