import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paginated } from '@/types/pagination';

type TablePaginationProps = {
    meta: Pick<
        Paginated<unknown>,
        'current_page' | 'last_page' | 'from' | 'to' | 'total' | 'links'
    >;
    perPage: number;
    pageSizes: number[];
    only?: string[];
};

function visit(url: string | null, only?: string[]) {
    if (!url) {
        return;
    }

    router.get(
        url,
        {},
        { preserveState: true, preserveScroll: true, replace: true, only },
    );
}

function changePageSize(perPage: number, only?: string[]) {
    const params = new URLSearchParams(window.location.search);
    params.set('per_page', String(perPage));
    params.delete('page');

    router.get(
        `${window.location.pathname}?${params.toString()}`,
        {},
        { preserveState: true, preserveScroll: true, replace: true, only },
    );
}

export default function TablePagination({
    meta,
    perPage,
    pageSizes,
    only,
}: TablePaginationProps) {
    const numbered = meta.links.filter(
        (link) =>
            !link.label.toLowerCase().includes('previous') &&
            !link.label.toLowerCase().includes('next'),
    );
    const prev = meta.links[0];
    const next = meta.links[meta.links.length - 1];

    return (
        <div
            className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row border-t border-border"
        >
            <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                    Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
                </p>
                <div className="flex items-center gap-1.5">
                    <span
                        className="text-[10px] font-bold tracking-widest text-muted-foreground"
                    >
                        ROWS
                    </span>
                    <select
                        value={perPage}
                        onChange={(e) =>
                            changePageSize(Number(e.target.value), only)
                        }
                        className="appearance-none rounded px-2 py-1 text-xs outline-none"
                        style={{
                            background: 'var(--c-surface-2)',
                            border: '1px solid var(--c-border)',
                            color: 'var(--c-text)',
                        }}
                    >
                        {pageSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {meta.last_page > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => visit(prev?.url ?? null, only)}
                        disabled={!prev?.url}
                        aria-label="Previous page"
                        className="flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-30 text-muted-foreground"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    {numbered.map((link, index) => (
                        <button
                            key={`${link.label}-${index}`}
                            type="button"
                            onClick={() => visit(link.url, only)}
                            disabled={!link.url}
                            className="flex h-7 min-w-7 items-center justify-center rounded px-2 text-xs font-semibold transition-colors"
                            style={{
                                background: link.active
                                    ? 'color-mix(in oklch, var(--primary) 15%, transparent)'
                                    : 'transparent',
                                color: link.active
                                    ? 'var(--c-cyan)'
                                    : 'var(--c-muted)',
                                border: link.active
                                    ? '1px solid color-mix(in oklch, var(--primary) 35%, transparent)'
                                    : '1px solid transparent',
                                cursor: link.url ? 'pointer' : 'default',
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => visit(next?.url ?? null, only)}
                        disabled={!next?.url}
                        aria-label="Next page"
                        className="flex h-7 w-7 items-center justify-center rounded transition-colors disabled:opacity-30 text-muted-foreground"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
