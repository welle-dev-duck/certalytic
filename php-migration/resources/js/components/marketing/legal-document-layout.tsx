import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import MarketingPageShell from '@/components/marketing/marketing-page-shell';
import { Button } from '@/components/ui/button';

type Props = PropsWithChildren<{
    title: string;
    description?: string;
    lastUpdated?: string;
}>;

export default function LegalDocumentLayout({
    title,
    description,
    lastUpdated = '7 June 2026',
    children,
}: Props) {
    return (
        <MarketingPageShell>
            <Head title={title} />

            <main className="mx-auto max-w-3xl px-6 py-12">
                <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
                    <Link href="/">
                        <ArrowLeft size={14} />
                        Back to home
                    </Link>
                </Button>

                <header className="border-b border-border pb-8">
                    <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                    <p className="mt-4 text-xs text-muted-foreground">
                        Last updated: {lastUpdated}
                    </p>
                </header>

                <article className="prose prose-sm dark:prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_p]:text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
                    {children}
                </article>
            </main>
        </MarketingPageShell>
    );
}
