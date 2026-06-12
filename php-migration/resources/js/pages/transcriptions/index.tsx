import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Eye,
    Mic,
    MoreHorizontal,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TablePagination from '@/components/certalytic/table-pagination';
import { StatusBadge } from '@/components/certalytic/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { dashboard as dashboardRoute } from '@/routes';
import { transcription as transcriptionUploadRoute } from '@/routes/tools';
import {
    destroy as destroyTranscription,
    index as transcriptionsIndex,
    show as transcriptionShow,
} from '@/routes/transcriptions';
import type { Paginated } from '@/types/pagination';

type TranscriptionListItem = {
    id: number;
    status: string;
    original_filename: string | null;
    duration_seconds: number | null;
    created_at: string | null;
};

type Props = {
    transcriptions: Paginated<TranscriptionListItem>;
    filters: { search: string; per_page: number };
    pageSizes: number[];
};

const TABLE_HEADERS = ['ID', 'File', 'Status', 'Started'] as const;

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolveTeamSlug(
    currentTeam: { slug: string } | null | undefined,
    pageUrl: string,
): string {
    if (currentTeam?.slug) {
        return currentTeam.slug;
    }

    return pageUrl.split('/').filter(Boolean)[0] ?? '';
}

export default function TranscriptionsIndex({
    transcriptions,
    filters,
    pageSizes,
}: Props) {
    const page = usePage<{ currentTeam?: { slug: string } | null }>();
    const teamSlug = resolveTeamSlug(page.props.currentTeam, page.url);
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [transcriptionToDelete, setTranscriptionToDelete] =
        useState<TranscriptionListItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const firstRender = useRef(true);

    const transcriptionDetailHref = (id: number) =>
        transcriptionShow.url([teamSlug, id]);

    const openDelete = (item: TranscriptionListItem) => {
        setTranscriptionToDelete(item);
        setDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!transcriptionToDelete) {
            return;
        }

        setDeleting(true);

        router.delete(
            destroyTranscription.url({
                current_team: teamSlug,
                transcription: transcriptionToDelete.id,
            }),
            {
                onFinish: () => {
                    setDeleting(false);
                    setDeleteOpen(false);
                    setTranscriptionToDelete(null);
                },
            },
        );
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                transcriptionsIndex(teamSlug).url,
                { search, per_page: filters.per_page },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <div className="space-y-6 p-6">
            <Head title="Transcriptions" />

            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);

                    if (!open) {
                        setTranscriptionToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete transcription?</DialogTitle>
                        <DialogDescription>
                            {transcriptionToDelete ? (
                                <>
                                    This permanently removes transcription #
                                    {transcriptionToDelete.id}
                                    {transcriptionToDelete.original_filename
                                        ? ` (${transcriptionToDelete.original_filename})`
                                        : ''}
                                    . This action cannot be undone.
                                </>
                            ) : null}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting…' : 'Delete transcription'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Transcriptions
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {transcriptions.total} transcription
                        {transcriptions.total === 1 ? '' : 's'} · speaker-labelled
                        interview audio
                    </p>
                </div>
                <Button size="sm" asChild>
                    <a href={transcriptionUploadRoute(teamSlug).url}>
                        <Mic size={13} />
                        New transcription
                    </a>
                </Button>
            </div>

            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by ID or filename…"
                    className="flex-1 bg-transparent text-sm text-foreground outline-none"
                />
            </div>

            <div className="rounded-lg border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead>
                            <tr className="border-b border-border">
                                {TABLE_HEADERS.map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-2.5 text-left text-[10px] font-bold tracking-widest text-muted-foreground"
                                    >
                                        {header}
                                    </th>
                                ))}
                                <th
                                    className="w-10 px-2 py-2.5"
                                    aria-label="Actions"
                                />
                                <th
                                    className="w-10 px-2 py-2.5"
                                    aria-label="View"
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {transcriptions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={TABLE_HEADERS.length + 2}
                                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                                    >
                                        No transcriptions match your search.
                                    </td>
                                </tr>
                            )}
                            {transcriptions.data.map((item, index) => {
                                const isLast =
                                    index === transcriptions.data.length - 1;

                                return (
                                    <tr
                                        key={item.id}
                                        className={cn(
                                            'group cursor-pointer transition-colors hover:bg-muted/50',
                                            !isLast && 'border-b border-border',
                                        )}
                                    >
                                        <td className="p-0 text-left font-mono text-sm text-foreground">
                                            <Link
                                                href={transcriptionDetailHref(
                                                    item.id,
                                                )}
                                                className="block px-4 py-3"
                                            >
                                                #{item.id}
                                            </Link>
                                        </td>
                                        <td className="p-0 text-left">
                                            <Link
                                                href={transcriptionDetailHref(
                                                    item.id,
                                                )}
                                                className="flex items-center gap-3 px-4 py-3"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
                                                    <Mic
                                                        size={14}
                                                        className="text-primary"
                                                    />
                                                </div>
                                                <span className="max-w-[280px] truncate text-sm font-semibold text-foreground group-hover:underline">
                                                    {item.original_filename ??
                                                        'Untitled audio'}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="p-0 text-left">
                                            <Link
                                                href={transcriptionDetailHref(
                                                    item.id,
                                                )}
                                                className="block px-4 py-3"
                                            >
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                            </Link>
                                        </td>
                                        <td className="p-0 text-left text-sm text-foreground">
                                            <Link
                                                href={transcriptionDetailHref(
                                                    item.id,
                                                )}
                                                className="block px-4 py-3"
                                            >
                                                {formatDateTime(
                                                    item.created_at,
                                                )}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer text-muted-foreground"
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        <MoreHorizontal
                                                            size={16}
                                                        />
                                                        <span className="sr-only">
                                                            Open menu
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={transcriptionDetailHref(
                                                                item.id,
                                                            )}
                                                        >
                                                            <Eye />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            openDelete(item)
                                                        }
                                                    >
                                                        <Trash2 />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <ChevronRight
                                                size={16}
                                                className="ml-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    meta={transcriptions}
                    perPage={filters.per_page}
                    pageSizes={pageSizes}
                    only={['transcriptions', 'filters']}
                />
            </div>
        </div>
    );
}

TranscriptionsIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Transcriptions',
            href: props.currentTeam
                ? transcriptionsIndex(props.currentTeam.slug).url
                : '/',
        },
    ],
});
