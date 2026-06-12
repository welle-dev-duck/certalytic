import {
    Briefcase,
    FileText,
    Fingerprint,
    Globe2,
    Layers,
    Mic,
    Scale,
    Sparkles,
    Users,
} from 'lucide-react';

const signals = [
    {
        icon: FileText,
        title: 'CV authenticity',
        weight: '25%',
        description:
            'Timeline coherence, employment gaps, and inflated seniority claims against the uploaded CV.',
    },
    {
        icon: Mic,
        title: 'Interview behavioral',
        weight: '50%',
        description:
            'Transcript depth, response latency, rehearsed phrasing, and consistency across interview rounds.',
    },
    {
        icon: Globe2,
        title: 'Cross-source consistency',
        weight: '15%',
        description:
            'LinkedIn, GitHub, and pasted profile content compared against CV and interview claims.',
    },
    {
        icon: Fingerprint,
        title: 'Identity confidence',
        weight: '10%',
        description:
            'Name, email, and handle alignment across documents and public sources.',
    },
];

const features = [
    {
        icon: Scale,
        title: 'Composite integrity score',
        description:
            'Weighted sub-scores roll up into one explainable hiring integrity index with cited flags.',
    },
    {
        icon: Mic,
        title: 'Speaker-labelled transcripts',
        description:
            'Upload Zoom or Teams audio - every line tagged by speaker for diarized review.',
    },
    {
        icon: Briefcase,
        title: 'Reusable role profiles',
        description:
            'Save job descriptions once; every screening inherits the same role context.',
    },
    {
        icon: Users,
        title: 'Team workspaces',
        description:
            'Shared pipelines for in-house TA squads and agencies with seat-based access.',
    },
    {
        icon: Layers,
        title: 'Signal summary & follow-ups',
        description:
            'AI-generated summaries, anomaly flags, and suggested deep-dive questions for interviewers.',
    },
    {
        icon: Users,
        title: 'Candidate behaviour analysis',
        description:
            'Communication style, collaboration indicators, and behavioural watchpoints from interview transcripts.',
    },
    {
        icon: Sparkles,
        title: 'Candidate personality analysis',
        description:
            'Work style, motivation signals, and culture-fit indicators for hiring-manager context.',
    },
];

export default function MarketingFeaturesBento() {
    return (
        <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-3 md:grid-cols-12">
            <div className="border border-border bg-card p-6 md:col-span-7 md:row-span-2">
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    Four integrity signals
                </p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                    Four signals. One dossier. One decision checkpoint.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Recruiters upload the CV and merged transcripts to build the
                    integrity dossier. Each dimension produces a sub-score, indicators,
                    and cited flags before the offer letter goes out.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {signals.map((signal) => (
                        <div
                            key={signal.title}
                            className="border border-border bg-muted/20 p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <signal.icon
                                    size={16}
                                    className="shrink-0 text-primary"
                                />
                                <span className="font-mono text-xs text-primary">
                                    {signal.weight}
                                </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-foreground">
                                {signal.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {signal.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {features.slice(0, 2).map((feature, index) => (
                <div
                    key={feature.title}
                    className={`border border-border p-6 md:col-span-5 ${index === 0 ? 'bg-primary/5' : 'bg-card'}`}
                >
                    <feature.icon size={18} className="text-primary" />
                    <h3 className="mt-4 font-semibold text-foreground">
                        {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {feature.description}
                    </p>
                </div>
            ))}

            {features.slice(2).map((feature) => (
                <div
                    key={feature.title}
                    className="border border-border bg-card p-6 md:col-span-4"
                >
                    <feature.icon size={18} className="text-primary" />
                    <h3 className="mt-4 font-semibold text-foreground">
                        {feature.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {feature.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
