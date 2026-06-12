import { router } from '@inertiajs/react';
import { Download, Eye, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportMethod, show as screeningShow } from '@/routes/candidates';

type Props = {
    candidateId: number;
    teamSlug: string;
    status: string;
    onRerun: () => void;
    onDelete: () => void;
};

export default function CandidateRowActions({
    candidateId,
    teamSlug,
    status,
    onRerun,
    onDelete,
}: Props) {
    const exportUrl = exportMethod.url([teamSlug, candidateId]);
    const canExport = status === 'complete';

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
                    onSelect={() =>
                        router.visit(
                            screeningShow.url([teamSlug, candidateId]),
                        )
                    }
                >
                    <Eye />
                    View
                </DropdownMenuItem>
                {canExport ? (
                    <DropdownMenuItem asChild>
                        <a
                            href={exportUrl}
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
                    className="cursor-pointer"
                    variant="destructive"
                    onSelect={onDelete}
                >
                    <Trash2 />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
