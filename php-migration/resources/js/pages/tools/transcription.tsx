import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, List, Mic, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import ToolsController from '@/actions/App/Http/Controllers/Tools/ToolsController';
import AlertError from '@/components/alert-error';
import { StatusBadge } from '@/components/certalytic/status-badge';
import FileDropzone from '@/components/file-dropzone';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { dashboard as dashboardRoute } from '@/routes';
import {
    index as transcriptionsIndex,
    show as transcriptionShow,
} from '@/routes/transcriptions';
import { transcription as transcriptionRoute } from '@/routes/tools';

type TranscriptionRecord = {
    id: number;
    status: string;
    original_filename: string | null;
    created_at: string | null;
};

type Props = {
    transcriptTokens: number;
    audioMaxMinutes: number;
    audioMaxMegabytes: number;
    transcriptionPackTokens: number;
    transcriptionPackPrice: number;
    canPurchaseTokens: boolean;
    transcriptions: TranscriptionRecord[];
};

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

export default function ToolsTranscription({
    transcriptTokens,
    audioMaxMinutes,
    audioMaxMegabytes,
    transcriptionPackTokens,
    transcriptionPackPrice,
    canPurchaseTokens,
    transcriptions,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [purchasing, setPurchasing] = useState(false);

    const submitTranscription = () => {
        if (!audioFile) {
            return;
        }

        const payload = new FormData();
        payload.append('audio', audioFile);

        setProcessing(true);
        setErrors({});

        router.post(ToolsController.transcribe.url(teamSlug), payload, {
            forceFormData: true,
            onError: (pageErrors) => {
                setErrors(pageErrors as Record<string, string>);
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
                setAudioFile(null);
            },
        });
    };

    const purchaseToken = () => {
        setPurchasing(true);

        router.post(
            ToolsController.purchaseToken.url(teamSlug),
            {},
            {
                onFinish: () => setPurchasing(false),
            },
        );
    };

    return (
        <div className="space-y-8">
            <Head title="Transcription" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <Heading
                    variant="small"
                    title="Transcription"
                    description="Standalone audio transcription for interview recordings."
                />
                <Button variant="outline" size="sm" asChild>
                    <Link href={transcriptionsIndex(teamSlug).url}>
                        <List size={14} />
                        View all transcriptions
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            Transcription tokens
                        </p>
                        <p className="mt-1 text-3xl font-bold text-primary">
                            {transcriptTokens}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Sold in packs of {transcriptionPackTokens}{' '}
                            (minimum purchase)
                        </p>
                    </div>
                    {canPurchaseTokens ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={purchaseToken}
                            disabled={purchasing}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Buy {transcriptionPackTokens} tokens ($
                            {transcriptionPackPrice})
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Transcribe audio</h2>
                </div>

                <p className="text-sm text-muted-foreground">
                    Upload meeting audio up to {audioMaxMinutes} minutes (~
                    {audioMaxMegabytes} MB). Speaker diarization labels each
                    line as{' '}
                    <span className="font-mono text-foreground">
                        Speaker 1: …
                    </span>{' '}
                    - rename speakers on the detail page. Audio is deleted from
                    storage immediately after transcription completes.
                </p>

                {Object.keys(errors).length > 0 ? (
                    <AlertError
                        errors={
                            Object.values(errors).filter(Boolean) as string[]
                        }
                    />
                ) : null}

                <div className="grid gap-2">
                    <Label htmlFor="tools-audio">Audio file</Label>
                    <FileDropzone
                        id="tools-audio"
                        accept=".mp3,.m4a,.wav"
                        file={audioFile}
                        onFileChange={setAudioFile}
                        description="MP3, M4A, or WAV - or click to browse"
                        aria-invalid={Boolean(errors.audio)}
                    />
                    <InputError message={errors.audio} />
                </div>

                <Button
                    type="button"
                    onClick={submitTranscription}
                    disabled={processing || audioFile === null}
                >
                    {processing ? 'Uploading…' : 'Transcribe (1 token)'}
                </Button>
            </div>

            {transcriptions.length > 0 ? (
                <div className="rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <h2 className="text-sm font-semibold text-foreground">
                            Recent transcriptions
                        </h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={transcriptionsIndex(teamSlug).url}>
                                View all
                            </Link>
                        </Button>
                    </div>
                    <div className="divide-y divide-border">
                        {transcriptions.map((item) => (
                            <Link
                                key={item.id}
                                href={transcriptionShow.url([
                                    teamSlug,
                                    item.id,
                                ])}
                                className={cn(
                                    'group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50',
                                )}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-primary/20 bg-primary/10">
                                        <Mic
                                            size={14}
                                            className="text-primary"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-foreground group-hover:underline">
                                            {item.original_filename ??
                                                `Transcription #${item.id}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            #{item.id} ·{' '}
                                            {formatDateTime(item.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge status={item.status} />
                                    <ChevronRight
                                        size={16}
                                        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

ToolsTranscription.layout = (props: {
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
            title: 'Tools',
            href: props.currentTeam
                ? transcriptionRoute(props.currentTeam.slug).url
                : '/',
        },
        {
            title: 'Transcription',
            href: props.currentTeam
                ? transcriptionRoute(props.currentTeam.slug).url
                : '/',
        },
    ],
});
