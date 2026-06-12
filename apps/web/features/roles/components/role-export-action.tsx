"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api-client";
import { handleMutationError } from "@/lib/mutation-errors";
import {
  useRequestRoleExport,
  useRoleLatestExport,
  type RoleExportSummary,
} from "@/features/roles/hooks/use-roles";

type RoleExportActionProps = {
  roleId: string;
};

export function RoleExportAction({ roleId }: RoleExportActionProps) {
  const [optimisticExporting, setOptimisticExporting] = useState(false);
  const exportInitiatedRef = useRef(false);
  const downloadedExportIdRef = useRef<string | null>(null);

  const requestExport = useRequestRoleExport(roleId);
  const { data: latestExport } = useRoleLatestExport(roleId);

  const isInProgress =
    latestExport?.status === "pending" ||
    latestExport?.status === "processing";

  const exporting = optimisticExporting || isInProgress || requestExport.isPending;

  useEffect(() => {
    if (
      !exportInitiatedRef.current ||
      latestExport?.status !== "complete" ||
      !latestExport.downloadUrl
    ) {
      return;
    }

    if (downloadedExportIdRef.current === latestExport.id) {
      return;
    }

    downloadedExportIdRef.current = latestExport.id;
    window.location.assign(apiUrl(latestExport.downloadUrl));
  }, [latestExport]);

  useEffect(() => {
    if (
      latestExport?.status === "complete" ||
      latestExport?.status === "failed"
    ) {
      setOptimisticExporting(false);
    }
  }, [latestExport?.status]);

  async function handleExport() {
    setOptimisticExporting(true);
    exportInitiatedRef.current = true;

    try {
      const result = await requestExport.mutateAsync();
      if (result.downloadUrl) {
        downloadedExportIdRef.current = result.id;
        window.location.assign(apiUrl(result.downloadUrl));
      }
    } catch (error) {
      setOptimisticExporting(false);
      exportInitiatedRef.current = false;
      handleMutationError(error, { fallbackMessage: "Export failed." });
    }
  }

  const exportFailed = latestExport?.status === "failed";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exporting}
        onClick={handleExport}
      >
        {exporting ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
        {exporting ? "Generating PDF…" : "Export PDF"}
      </Button>
      {exportFailed && latestExport?.errorMessage ? (
        <p className="max-w-xs text-right text-[10px] text-destructive">
          Export failed: {latestExport.errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export type { RoleExportSummary };
