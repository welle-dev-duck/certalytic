"use client";

import { Download, Eye, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiUrl } from "@/lib/api-client";
import { routes } from "@/lib/routes";

type CandidateRowActionsProps = {
  candidateId: string;
  status: string;
  onRerun: () => void;
  onDelete: () => void;
};

export function CandidateRowActions({
  candidateId,
  status,
  onRerun,
  onDelete,
}: CandidateRowActionsProps) {
  const router = useRouter();
  const canExport = status === "complete";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer text-muted-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal size={16} />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => router.push(routes.candidate(candidateId))}
        >
          <Eye />
          View
        </DropdownMenuItem>
        {canExport ? (
          <DropdownMenuItem asChild>
            <a
              href={apiUrl(`/api/candidates/${candidateId}/export`)}
              className="flex cursor-pointer items-center gap-2"
            >
              <Download />
              Export PDF
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className="cursor-pointer" onSelect={onRerun}>
          <RefreshCw />
          Re-run screening
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
