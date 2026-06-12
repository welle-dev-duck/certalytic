import { router } from '@inertiajs/react';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportMethod as requestRoleExport } from '@/routes/roles';

export type RoleExportStatus = {
    id: number;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    error_message: string | null;
    completed_at: string | null;
    download_url: string | null;
};

type Props = {
    teamSlug: string;
    roleId: number;
    latestExport: RoleExportStatus | null;
    variant?: 'button' | 'menu-item';
    onSelect?: () => void;
};

export function useRoleExportPolling(
    latestExport: RoleExportStatus | null,
    onExportFinished?: () => void,
) {
    const exportInitiatedRef = useRef(false);
    const downloadedExportIdRef = useRef<number | null>(null);

    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;

            if (flash?.exportQueued) {
                exportInitiatedRef.current = true;
            }
        });
    }, []);

    useEffect(() => {
        const isInProgress =
            latestExport?.status === 'pending' ||
            latestExport?.status === 'processing';

        if (!isInProgress) {
            return;
        }

        const interval = window.setInterval(() => {
            router.reload({ only: ['latestExport'] });
        }, 3000);

        return () => window.clearInterval(interval);
    }, [latestExport?.status]);

    useEffect(() => {
        if (
            latestExport?.status === 'complete' ||
            latestExport?.status === 'failed'
        ) {
            onExportFinished?.();
        }

        if (!exportInitiatedRef.current || latestExport?.status !== 'complete') {
            return;
        }

        if (
            latestExport.download_url === null ||
            downloadedExportIdRef.current === latestExport.id
        ) {
            return;
        }

        downloadedExportIdRef.current = latestExport.id;
        window.location.assign(latestExport.download_url);
    }, [latestExport, onExportFinished]);

    return {
        isExporting:
            latestExport?.status === 'pending' ||
            latestExport?.status === 'processing',
        exportFailed: latestExport?.status === 'failed',
        exportError: latestExport?.error_message,
        markExportInitiated: () => {
            exportInitiatedRef.current = true;
        },
    };
}

export default function RoleExportAction({
    teamSlug,
    roleId,
    latestExport,
    variant = 'button',
    onSelect,
}: Props) {
    const [optimisticExporting, setOptimisticExporting] = useState(false);

    const { isExporting, exportFailed, exportError, markExportInitiated } =
        useRoleExportPolling(latestExport, () => setOptimisticExporting(false));

    const exporting = optimisticExporting || isExporting;

    const queueExport = () => {
        setOptimisticExporting(true);
        markExportInitiated();
        router.post(
            requestRoleExport.url([teamSlug, roleId]),
            {},
            {
                preserveScroll: true,
                onFinish: () => setOptimisticExporting(false),
                onError: () => setOptimisticExporting(false),
            },
        );
    };

    const handleExport = () => {
        onSelect?.();
        queueExport();
    };

    if (variant === 'menu-item') {
        return (
            <button
                type="button"
                className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                disabled={exporting}
                onClick={(event) => {
                    event.stopPropagation();
                    handleExport();
                }}
            >
                {exporting ? <Loader2 className="animate-spin" /> : <Download />}
                {exporting ? 'Generating PDF…' : 'Export PDF'}
            </button>
        );
    }

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
                {exporting ? 'Generating PDF…' : 'Export PDF'}
            </Button>
            {exportFailed && exportError ? (
                <p className="max-w-xs text-right text-[10px] text-destructive">
                    Export failed: {exportError}
                </p>
            ) : null}
        </div>
    );
}
