import { Star } from 'lucide-react';

const reviews = [
    {
        quote: 'We caught rehearsed technical answers before the onsite. The integrity breakdown gave us concrete follow-up questions instead of gut feel.',
        name: 'Elena V.',
        role: 'Head of Talent',
        org: 'Series B fintech',
        initials: 'EV',
        accent: 'bg-primary/15 text-primary',
        rating: 5,
    },
    {
        quote: 'Cross-referencing CV claims against LinkedIn paste saved us a bad senior hire. The platform mismatch flag was spot on.',
        name: 'Marcus T.',
        role: 'Lead Recruiter',
        org: 'EU product studio',
        initials: 'MT',
        accent: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        rating: 5,
    },
    {
        quote: 'Our team runs 40+ technical screens a month. Certalytic keeps the signal consistent without adding another ATS integration project.',
        name: 'Sofia K.',
        role: 'VP People',
        org: 'Remote-first scale-up',
        initials: 'SK',
        accent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        rating: 5,
    },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={index}
                    size={14}
                    className={
                        index < rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-muted text-muted'
                    }
                />
            ))}
        </div>
    );
}

export default function MarketingReviewsSection() {
    return (
        <section id="reviews" className="py-20 md:py-24">
            <div className="mx-auto max-w-6xl px-6">
                <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
                    Trusted by teams protecting €100k+ hiring decisions
                </h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                    In-house TA, agencies, and embedded recruiters share how
                    integrity signals changed their technical screening process.
                </p>
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {reviews.map((review) => (
                        <figure
                            key={review.name}
                            className="flex h-full flex-col border border-border bg-background p-6"
                        >
                            <StarRating rating={review.rating} />
                            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                                “{review.quote}”
                            </blockquote>
                            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${review.accent}`}
                                    aria-hidden
                                >
                                    {review.initials}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                        {review.name}
                                    </span>
                                    <br />
                                    {review.role} · {review.org}
                                </div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
