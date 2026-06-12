import { Head, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    ChevronRight,
    Download,
    Eye,
    Lock,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TablePagination from '@/components/certalytic/table-pagination';
import RoleFormDialog from '@/components/roles/role-form-dialog';
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
import { destroy as destroyRole, exportMethod as requestRoleExport, index as rolesIndex, show as roleShow } from '@/routes/roles';
import type { Paginated } from '@/types/pagination';
import type { JobRole, RoleListItem } from '@/types/roles';

type Props = {
    roles: Paginated<RoleListItem>;
    filters: { search: string; per_page: number };
    pageSizes: number[];
};

const TABLE_HEADERS = [
    'Role',
    'Candidates',
    'Avg Integrity',
    'Created',
] as const;

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function toJobRole(role: RoleListItem): JobRole {
    return {
        id: role.id,
        title: role.title,
        description: role.description,
        context_metadata: role.context_metadata,
        candidates_count: role.candidates_count,
        documents: [],
        created_at: role.created_at,
    };
}

export default function RolesPage({ roles, filters, pageSizes }: Props) {
    const { currentTeam, canSavedRoles } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<JobRole | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                rolesIndex(teamSlug).url,
                { search, per_page: filters.per_page },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const openEdit = (role: RoleListItem) => {
        setEditingRole(toJobRole(role));
        setEditOpen(true);
    };

    const openDelete = (role: RoleListItem) => {
        setRoleToDelete(role);
        setDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!roleToDelete) {
            return;
        }

        setDeleting(true);

        router.delete(destroyRole.url([teamSlug, roleToDelete.id]), {
            onFinish: () => {
                setDeleting(false);
                setDeleteOpen(false);
                setRoleToDelete(null);
            },
        });
    };

    if (canSavedRoles === false) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-6 text-center">
                <Head title="Roles" />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10">
                    <Lock size={20} className="text-chart-2" />
                </div>
                <div>
                    <p className="text-base font-bold text-foreground">
                        Saved Role Profiles - Starter+
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Upgrade to Starter to create reusable Role Profiles and
                        enable cross-candidate trend detection.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-6">
            <Head title="Roles" />
            <RoleFormDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                teamSlug={teamSlug}
                mode="create"
            />
            {editingRole && (
                <RoleFormDialog
                    open={editOpen}
                    onOpenChange={(open) => {
                        setEditOpen(open);

                        if (!open) {
                            setEditingRole(null);
                        }
                    }}
                    teamSlug={teamSlug}
                    mode="edit"
                    role={editingRole}
                />
            )}

            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);

                    if (!open) {
                        setRoleToDelete(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete role?</DialogTitle>
                        <DialogDescription>
                            {roleToDelete ? (
                                <>
                                    This will permanently delete{' '}
                                    <span className="font-semibold text-foreground">
                                        {roleToDelete.title}
                                    </span>
                                    . Candidates keep their snapshot title and
                                    description.
                                </>
                            ) : (
                                'This action cannot be undone.'
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeleteOpen(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting…' : 'Delete role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Role Profiles
                    </h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {roles.total} saved role{roles.total === 1 ? '' : 's'} ·
                        reusable across all team members
                    </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus size={13} />
                    New Role
                </Button>
            </div>

            <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                <Search size={14} className="text-muted-foreground" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search roles…"
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
                            <th className="w-10 px-2 py-2.5" aria-label="Actions" />
                            <th className="w-10 px-2 py-2.5" aria-label="View" />
                        </tr>
                    </thead>
                    <tbody>
                        {roles.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={TABLE_HEADERS.length + 2}
                                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                                >
                                    No roles match your search.
                                </td>
                            </tr>
                        )}
                        {roles.data.map((role, index) => {
                            const avg = role.avg_integrity;
                            const isLast = index === roles.data.length - 1;

                            return (
                                <tr
                                    key={role.id}
                                    onClick={() =>
                                        router.visit(
                                            roleShow.url([teamSlug, role.id]),
                                        )
                                    }
                                    className={cn(
                                        'group cursor-pointer transition-colors hover:bg-muted/50',
                                        !isLast && 'border-b border-border',
                                    )}
                                >
                                    <td className="px-4 py-3 text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
                                                <Briefcase
                                                    size={14}
                                                    className="text-primary"
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-foreground group-hover:underline">
                                                {role.title}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-left text-sm text-foreground">
                                        {role.candidates_count}
                                    </td>
                                    <td className="px-4 py-3 text-left text-sm text-foreground">
                                        {avg !== null ? avg : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-left text-sm text-foreground">
                                        {formatDate(role.created_at)}
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
                                                    <MoreHorizontal size={16} />
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
                                                    onSelect={() =>
                                                        router.visit(
                                                            roleShow.url([
                                                                teamSlug,
                                                                role.id,
                                                            ]),
                                                        )
                                                    }
                                                >
                                                    <Eye />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() =>
                                                        openEdit(role)
                                                    }
                                                >
                                                    <Pencil />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    onSelect={() =>
                                                        router.post(
                                                            requestRoleExport.url([
                                                                teamSlug,
                                                                role.id,
                                                            ]),
                                                        )
                                                    }
                                                >
                                                    <Download />
                                                    Export PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer"
                                                    variant="destructive"
                                                    onSelect={() =>
                                                        openDelete(role)
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
                                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
                <TablePagination
                    meta={roles}
                    perPage={filters.per_page}
                    pageSizes={pageSizes}
                    only={['roles', 'filters']}
                />
            </div>
        </div>
    );
}

RolesPage.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? dashboardRoute.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Roles',
            href: props.currentTeam
                ? rolesIndex(props.currentTeam.slug).url
                : '/',
        },
    ],
});
