import { router } from '@inertiajs/react';
import { Sym } from '@/components/sym';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/pagination';

type DataPaginationProps = {
    meta: Pick<
        Paginated<unknown>,
        'current_page' | 'last_page' | 'from' | 'to' | 'total' | 'links'
    >;
    only?: string[];
    className?: string;
};

function go(url: string | null, only?: string[]) {
    if (!url) {
        return;
    }

    router.get(
        url,
        {},
        {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only,
        },
    );
}

export default function DataPagination({
    meta,
    only,
    className,
}: DataPaginationProps) {
    if (meta.total === 0) {
        return null;
    }

    const numberedLinks = meta.links.filter(
        (link) =>
            !link.label.toLowerCase().includes('previous') &&
            !link.label.toLowerCase().includes('next'),
    );
    const prev = meta.links[0];
    const next = meta.links[meta.links.length - 1];

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-low px-6 py-4 sm:flex-row',
                className,
            )}
        >
            <p className="font-body-sm text-on-surface-variant">
                Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
            </p>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => go(prev?.url ?? null, only)}
                    disabled={!prev?.url}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-30"
                    aria-label="Previous page"
                >
                    <Sym name="chevron_left" className="text-base" />
                </button>
                {numberedLinks.map((link, linkIndex) => (
                    <button
                        key={`${link.label}-${linkIndex}`}
                        type="button"
                        onClick={() => go(link.url, only)}
                        disabled={!link.url}
                        className={cn(
                            'font-body-sm flex h-8 min-w-8 items-center justify-center rounded-lg px-2 transition-colors',
                            link.active
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:bg-surface-container-high',
                            !link.url && 'cursor-default opacity-50',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
                <button
                    type="button"
                    onClick={() => go(next?.url ?? null, only)}
                    disabled={!next?.url}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-30"
                    aria-label="Next page"
                >
                    <Sym name="chevron_right" className="text-base" />
                </button>
            </div>
        </div>
    );
}
