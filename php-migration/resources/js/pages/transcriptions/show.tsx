import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Copy, Mic } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/certalytic/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard as dashboardRoute } from '@/routes';
import {
    index as transcriptionsIndex,
    show as transcriptionShow,
} from '@/routes/transcriptions';
import { update as updateSpeakers } from '@/routes/transcriptions/speakers';

type Segment = {
    speaker_id: string;
    text: string;
    start: number | null;
    end: number | null;
};

type TranscriptionDetail = {
    id: number;
    status: string;
    original_filename: string | null;
    transcript_text: string | null;
    error_message: string | null;
    duration_seconds: number | null;
    speaker_labels: Record<string, string>;
    segments: Segment[];
    created_at: string | null;
    updated_at: string | null;
};

type Props = {
    transcription: TranscriptionDetail;
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

export default function TranscriptionShow({ transcription }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [speakerLabels, setSpeakerLabels] = useState(
        transcription.speaker_labels ?? {},
    );
    const [saving, setSaving] = useState(false);

    const isProcessing =
        transcription.status === 'pending' ||
        transcription.status === 'processing';

    useEffect(() => {
        setSpeakerLabels(transcription.speaker_labels ?? {});
    }, [transcription.speaker_labels]);

    useEffect(() => {
        if (!isProcessing) {
            return;
        }

        const interval = window.setInterval(() => {
            router.reload({ only: ['transcription'] });
        }, 4000);

        return () => window.clearInterval(interval);
    }, [isProcessing]);

    const speakerIds = useMemo(
        () =>
            Array.from(
                new Set(
                    (transcription.segments ?? []).map(
                        (segment) => segment.speaker_id,
                    ),
                ),
            ),
        [transcription.segments],
    );

    const saveSpeakerLabels = () => {
        setSaving(true);

        router.patch(
            updateSpeakers.url([teamSlug, transcription.id]),
            { speaker_labels: speakerLabels },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Speaker labels updated.'),
                onFinish: () => setSaving(false),
            },
        );
    };

    const copyTranscript = async () => {
        if (!transcription.transcript_text) {
            return;
        }

        await navigator.clipboard.writeText(transcription.transcript_text);
        toast.success('Transcript copied to clipboard.');
    };

    return (
        <div className="space-y-6 p-6">
            <Head title={`Transcription #${transcription.id}`} />

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                    <Button variant="ghost" size="sm" asChild className="-ml-2">
                        <a href={transcriptionsIndex(teamSlug).url}>
                            <ArrowLeft size={14} />
                            All transcriptions
                        </a>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded border border-primary/20 bg-primary/10">
                            <Mic size={18} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                {transcription.original_filename ??
                                    `Transcription #${transcription.id}`}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Started {formatDateTime(transcription.created_at)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={transcription.status} />
                    {transcription.transcript_text ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyTranscript}
                        >
                            <Copy size={14} />
                            Copy
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                        ID
                    </p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">
                        #{transcription.id}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                        Duration
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                        {transcription.duration_seconds
                            ? `${Math.round(transcription.duration_seconds / 60)} min`
                            : '-'}
                    </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
                        Last updated
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatDateTime(transcription.updated_at)}
                    </p>
                </div>
            </div>

            {transcription.error_message ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {transcription.error_message}
                </div>
            ) : null}

            {speakerIds.length > 0 && transcription.status === 'complete' ? (
                <div className="rounded-lg border border-border bg-card p-5">
                    <h2 className="text-sm font-semibold text-foreground">
                        Speaker labels
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Rename speakers so each line reads like{' '}
                        <span className="font-mono">Hans: …</span>
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {speakerIds.map((speakerId) => (
                            <div key={speakerId} className="grid gap-1.5">
                                <Label htmlFor={`speaker-${speakerId}`}>
                                    {speakerId}
                                </Label>
                                <Input
                                    id={`speaker-${speakerId}`}
                                    value={speakerLabels[speakerId] ?? ''}
                                    onChange={(event) =>
                                        setSpeakerLabels((current) => ({
                                            ...current,
                                            [speakerId]: event.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Hans"
                                    maxLength={100}
                                />
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="mt-4"
                        onClick={saveSpeakerLabels}
                        disabled={saving}
                    >
                        {saving ? 'Saving…' : 'Update labels'}
                    </Button>
                </div>
            ) : null}

            <div className="rounded-lg border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">
                        Transcript
                    </h2>
                </div>
                <div className="p-4">
                    {isProcessing ? (
                        <p className="animate-pulse text-sm text-muted-foreground">
                            Transcription in progress… this page refreshes
                            automatically.
                        </p>
                    ) : transcription.transcript_text ? (
                        <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                            {transcription.transcript_text}
                        </pre>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No transcript available yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

TranscriptionShow.layout = (props: {
    currentTeam?: { slug: string } | null;
    transcription: TranscriptionDetail;
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
        {
            title: `#${props.transcription.id}`,
            href: props.currentTeam
                ? transcriptionShow.url({
                      current_team: props.currentTeam.slug,
                      transcription: props.transcription.id,
                  })
                : '/',
        },
    ],
});
