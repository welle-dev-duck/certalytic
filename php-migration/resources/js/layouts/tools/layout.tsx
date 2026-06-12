import { Link, usePage } from '@inertiajs/react';
import { Mic } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { transcription as transcriptionRoute } from '@/routes/tools';

export default function ToolsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { currentTeam } = usePage().props as {
        currentTeam?: { slug: string };
    };
    const teamSlug = currentTeam?.slug ?? '';

    const navItems = [
        {
            title: 'Transcription',
            href: teamSlug ? transcriptionRoute(teamSlug) : '#',
            icon: Mic,
        },
    ];

    return (
        <div className="space-y-8 p-6">
            <Heading
                title="Tools"
                description="Standalone utilities for your hiring workflow"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex flex-col space-y-1"
                        aria-label="Tools"
                    >
                        {navItems.map((item) => (
                            <Button
                                key={toUrl(item.href)}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start gap-2', {
                                    'bg-muted': isCurrentOrParentUrl(
                                        item.href,
                                    ),
                                })}
                            >
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </div>
    );
}
