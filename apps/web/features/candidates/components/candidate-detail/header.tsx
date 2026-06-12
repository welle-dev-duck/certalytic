"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "@/components/ui/link";

import { Button } from "@/components/ui/button";
import type { CandidateDetail as CandidateDetailType } from "@/features/candidates/types";
import { apiUrl } from "@/lib/api-client";
import { routes } from "@/lib/routes";

type CandidateDetailHeaderProps = {
  candidate: CandidateDetailType;
  isComplete: boolean;
  onRerun: () => void;
  onDelete: () => void;
};

export function CandidateDetailHeader({
  candidate,
  isComplete,
  onRerun,
  onDelete,
}: CandidateDetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={routes.candidates()}>
          <ArrowLeft size={14} />
          Back to Candidates
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-2">
        {isComplete ? (
          <Button size="sm" variant="outline" asChild>
            <a
              href={apiUrl(`/api/candidates/${candidate.id}/export`)}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={14} />
              Export PDF
            </a>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={onRerun}>
          <RefreshCw size={14} />
          Re-run
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );
}
