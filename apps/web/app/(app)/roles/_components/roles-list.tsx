"use client";

import {
  Briefcase,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "@/components/ui/link"
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { TablePagination } from "@/components/certalytic/table-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import { useDeleteRole, useRoles } from "@/features/roles/hooks/use-roles";
import type { RoleListItem } from "@/features/roles/types";
import { useCursorPagination, cursorPageRange } from "@/hooks/use-cursor-pagination";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RolesList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null);
  const [pageSize, setPageSize] = useState(25);
  const firstRender = useRef(true);
  const { cursor, hasPrevPage, pageIndex, goNext, goPrev, reset } =
    useCursorPagination();

  const deleteRole = useDeleteRole();
  const { data, isLoading } = useRoles({
    search: debouncedSearch || undefined,
    limit: pageSize,
    cursor,
  });

  const roles = data?.data ?? [];
  const pagination = data?.pagination;
  const { from, to } = cursorPageRange(pageIndex, pageSize, roles.length);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      reset();
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    reset();
  }, [pageSize, reset]);

  function confirmDelete() {
    if (!roleToDelete) return;

    deleteRole.mutate(roleToDelete.id, {
      onSuccess: () => {
        toast.success("Role deleted.");
        setDeleteOpen(false);
        setRoleToDelete(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete role.",
        );
      },
    });
  }

  return (
    <div className="space-y-5 p-6">
      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      <RoleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        role={editingRole}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              {roleToDelete
                ? `This will permanently delete "${roleToDelete.title}". Candidates linked to this role will keep their data but lose the role association.`
                : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteRole.isPending}
              onClick={confirmDelete}
            >
              {deleteRole.isPending ? "Deleting…" : "Delete role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Roles</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Saved role profiles for repeatable screening context
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={13} />
          New role
        </Button>
      </div>

      <div className="flex min-w-52 items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Search size={14} className="text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Loading roles…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { label: "Role", className: "w-[28%] max-w-[220px]" },
                      { label: "Candidates", className: "" },
                      { label: "Avg Integrity", className: "" },
                      { label: "Created", className: "" },
                    ].map((header) => (
                      <th
                        key={header.label}
                        className={`px-4 py-3 text-left text-[10px] font-bold tracking-widest text-muted-foreground ${header.className}`}
                      >
                        {header.label}
                      </th>
                    ))}
                    <th className="w-10 px-2 py-3" aria-label="Actions" />
                    <th className="w-10 px-2 py-3" aria-label="View" />
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No roles yet. Create your first role to get started.
                      </td>
                    </tr>
                  )}
                  {roles.map((role, index) => (
                    <tr
                      key={role.id}
                      onClick={() => router.push(routes.role(role.id))}
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-muted/50",
                        index < roles.length - 1 && "border-b border-border",
                      )}
                    >
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                            style={{
                              background:
                                "color-mix(in oklch, var(--primary) 10%, transparent)",
                              color: "var(--c-cyan)",
                            }}
                          >
                            <Briefcase size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:underline">
                              {role.title}
                            </p>
                            {role.description && (
                              <p className="line-clamp-1 text-[10px] text-muted-foreground">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {role.candidatesCount}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {role.avgIntegrity !== null
                          ? Math.round(role.avgIntegrity)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {formatDate(role.createdAt)}
                      </td>
                      <td
                        className="px-2 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingRole(role);
                                setEditOpen(true);
                              }}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => {
                                setRoleToDelete(role);
                                setDeleteOpen(true);
                              }}
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
                  ))}
                </tbody>
              </table>
            </div>
            {pagination ? (
              <TablePagination
                meta={{ ...pagination, from, to }}
                hasPrevPage={hasPrevPage}
                onNextPage={() => {
                  if (pagination.nextCursor) {
                    goNext(pagination.nextCursor);
                  }
                }}
                onPrevPage={goPrev}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  reset();
                }}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
