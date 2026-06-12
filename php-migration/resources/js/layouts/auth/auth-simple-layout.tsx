import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh flex-1 overflow-y-auto lg:grid-cols-2">
            <div className="brand-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.42_0.06_172_/_0.35),transparent_55%)]"
                />
                <Link
                    href={home()}
                    prefetch
                    className="relative z-10 inline-flex items-center gap-3"
                >
                    <div className="flex size-10 items-center justify-center rounded-sm bg-white/10 ring-1 ring-white/25">
                        <AppLogoIcon className="size-5 text-white" />
                    </div>
                    <div>
                        <p className="font-display text-lg font-semibold tracking-tight">
                            Certalytic
                        </p>
                        <p className="text-[10px] font-medium tracking-wide text-white/60 uppercase">
                            Hire with confidence
                        </p>
                    </div>
                </Link>
                <div className="relative z-10 max-w-md space-y-4">
                    <p className="font-display text-3xl font-semibold tracking-tight text-balance text-white">
                        Prevent the costly mistake of hiring a proxy candidate
                    </p>
                    <p className="text-sm leading-relaxed text-white/80">
                        Build the integrity dossier before the offer letter-
                        EU-sovereign CV, transcript, and profile cross-checks
                        with cited flags, not automated verdicts.
                    </p>
                </div>
                <p className="relative z-10 text-xs tracking-wide text-white/55 uppercase">
                    Certalytic · Decision support only
                </p>
            </div>

            <div className="flex flex-col items-center justify-center border-border bg-background p-6 md:p-10 lg:border-l">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col gap-6 lg:hidden">
                        <Link
                            href={home()}
                            className="inline-flex max-w-fit items-center gap-2"
                        >
                            <AppLogo />
                        </Link>
                    </div>

                    <div className="surface-panel p-6">
                        <div className="mb-8 space-y-2">
                            <h1 className="font-display text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            {description ? (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {description}
                                </p>
                            ) : null}
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
