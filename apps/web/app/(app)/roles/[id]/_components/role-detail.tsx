"use client";

import { ArrowLeft, Download, Pencil, Plus, Upload } from "lucide-react";
import Link from "@/components/ui/link"
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { Button } from "@/components/ui/button";
import { StartScreeningModal } from "@/features/candidates/components/start-screening-modal";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import {
  useRequestRoleExport,
  useRole,
  useUploadRoleDocument,
} from "@/features/roles/hooks/use-roles";
import { useCandidates } from "@/features/candidates/hooks/use-candidates";
import { getIntegrityLevel } from "@/lib/integrity";
import { routes } from "@/lib/routes";

export function RoleDetail({ roleId }: { roleId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: role, isLoading } = useRole(roleId);
  const uploadDocument = useUploadRoleDocument(roleId);
  const requestExport = useRequestRoleExport(roleId);

  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    role_id: roleId,
    limit: 25,
  });

  const candidates = useMemo(
    () => candidatesData?.pages.flatMap((page) => page.data) ?? [],
    [candidatesData],
  );

  if (isLoading || !role) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading role…
      </div>
    );
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument.mutateAsync(file);
      toast.success("Document uploaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function handleExport() {
    try {
      const result = await requestExport.mutateAsync();
      if (result.downloadUrl) {
        window.open(result.downloadUrl, "_blank");
      } else {
        toast.success("Export queued. Check back shortly.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export failed.",
      );
    }
  }

  return (
    <div className="space-y-6 p-6">
      <RoleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        role={role}
      />
      <StartScreeningModal
        open={screenOpen}
        onOpenChange={setScreenOpen}
        preselectedRoleId={roleId}
        lockRole
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.roles()}>
            <ArrowLeft size={14} />
            Back
          </Link>
        </Button>
        <Button size="sm" onClick={() => setScreenOpen(true)}>
          <Plus size={14} />
          Screen candidate
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil size={14} />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadDocument.isPending}
        >
          <Upload size={14} />
          Upload document
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.md,.markdown,.txt"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={requestExport.isPending}
        >
          <Download size={14} />
          Export role PDF
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground">{role.title}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Candidates
            </p>
            <p className="mt-1 font-mono text-xl font-bold">
              {role.candidatesCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Avg integrity
            </p>
            <p className="mt-1 font-mono text-xl font-bold">
              {role.avgIntegrity !== null
                ? Math.round(role.avgIntegrity)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Documents
            </p>
            <p className="mt-1 font-mono text-xl font-bold">
              {role.documents.length}
            </p>
          </div>
        </div>

        {role.description && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Job description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {role.description}
            </p>
          </div>
        )}

        {role.documents.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Context documents
            </p>
            <ul className="mt-3 space-y-2">
              {role.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
                >
                  <span>{doc.originalName}</span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {doc.ocrStatus}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            Candidates for this role
          </p>
        </div>
        {candidatesLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading candidates…
          </p>
        ) : candidates.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No candidates screened for this role yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  {["Candidate", "Status", "Score", "Integrity"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-[10px] font-bold tracking-widest text-muted-foreground"
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => {
                  const score =
                    candidate.integrityScore !== null
                      ? Math.round(candidate.integrityScore)
                      : null;

                  return (
                    <tr
                      key={candidate.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={routes.candidate(candidate.id)}
                          className="text-sm font-semibold hover:underline"
                        >
                          {candidate.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={candidate.status} />
                      </td>
                      <td className="px-4 py-3">
                        {score !== null ? (
                          <ScoreRing score={score} size={32} strokeWidth={3} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {score !== null ? (
                          <IntegrityBadge level={getIntegrityLevel(score)} />
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
