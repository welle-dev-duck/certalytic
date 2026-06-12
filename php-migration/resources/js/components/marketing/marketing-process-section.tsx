import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

type ScreenshotPlaceholderProps = {
    filename: string;
    label: string;
};

function ScreenshotPlaceholder({ filename, label }: ScreenshotPlaceholderProps) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const src = `/marketing/${filename}`;

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {!failed ? (
                <img
                    src={src}
                    alt={label}
                    className={loaded ? 'block w-full' : 'hidden'}
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                />
            ) : null}
            {!loaded || failed ? (
                <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 border border-dashed border-muted-foreground/25 bg-muted/20 p-6 text-center">
                    <ImageIcon
                        size={28}
                        className="text-muted-foreground/60"
                        strokeWidth={1.5}
                    />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {label}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Drop screenshot at{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                                public/marketing/{filename}
                            </code>
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

const processSteps = [
    {
        step: 1,
        title: 'Create a role',
        description:
            'Define the position once—title, job description, and optional context documents. Every candidate screened against this role inherits the same baseline.',
        screenshots: [
            {
                filename: 'process-create-role.png',
                label: 'Role creation form',
            },
        ],
    },
    {
        step: 2,
        title: 'Screen candidates',
        description:
            'Run each applicant through the guided multi-step form: candidate details & CV, cross-reference links, then merged interview transcripts.',
        screenshots: [
            {
                filename: 'process-candidate-details.png',
                label: 'Step 1 · Candidate & CV',
            },
            {
                filename: 'process-candidate-crossref.png',
                label: 'Step 2 · LinkedIn & GitHub',
            },
            {
                filename: 'process-candidate-transcripts.png',
                label: 'Step 3 · Interview transcripts',
            },
        ],
    },
    {
        step: 3,
        title: 'Export the report',
        description:
            'Review the integrity dossier in-app, then export a watermarked PDF for your hiring committee—or batch-export every candidate on a role.',
        screenshots: [
            {
                filename: 'process-export-report.png',
                label: 'Integrity dossier & PDF export',
            },
        ],
    },
] as const;

export default function MarketingProcessSection() {
    return (
        <section id="how-it-works" className="border-b border-border py-20 md:py-24">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mb-14 max-w-2xl">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                        How it works
                    </p>
                    <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">
                        Three steps from role to dossier
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Certalytic fits at the end of your interview loop. Create the
                        role, screen each finalist, export the evidence-backed report
                        before anyone signs an offer letter.
                    </p>
                </div>

                <div className="space-y-20">
                    {processSteps.map((item) => (
                        <div
                            key={item.step}
                            className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12"
                        >
                            <div className="lg:sticky lg:top-24">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-serif text-lg font-bold text-primary">
                                    {item.step}
                                </div>
                                <h3 className="mt-4 font-serif text-2xl tracking-tight text-foreground">
                                    {item.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>

                            <div
                                className={
                                    item.screenshots.length > 1
                                        ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'
                                        : 'max-w-2xl'
                                }
                            >
                                {item.screenshots.map((screenshot) => (
                                    <ScreenshotPlaceholder
                                        key={screenshot.filename}
                                        filename={screenshot.filename}
                                        label={screenshot.label}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
