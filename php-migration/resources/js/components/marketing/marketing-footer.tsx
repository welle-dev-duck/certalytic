import { Link, usePage } from '@inertiajs/react';
import { Github, Linkedin } from 'lucide-react';

function XIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export default function MarketingFooter() {
    const { name, company, socialLinks } = usePage().props;
    const year = new Date().getFullYear();

    const legalLinks = [
        { label: 'Privacy Policy', href: '/legal/privacy' },
        { label: 'Terms of Service', href: '/legal/terms' },
        { label: 'Data Processing Agreement', href: '/legal/dpa' },
        { label: 'Cookie Policy', href: '/legal/cookies' },
        { label: 'Imprint', href: '/legal/imprint' },
    ];

    return (
        <footer className="border-t border-border bg-card/40">
            <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-4 lg:col-span-2">
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                        The EU-sovereign integrity dossier for senior technical hires.
                        Prevent costly proxy candidates before the offer letter- with
                        probabilistic signals, never automated gates.
                    </p>
                    <div className="flex items-center gap-3">
                        <a
                            href={socialLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={16} />
                        </a>
                        <a
                            href={socialLinks.github}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            aria-label="GitHub"
                        >
                            <Github size={16} />
                        </a>
                        <a
                            href={socialLinks.x}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                            aria-label="X"
                        >
                            <XIcon />
                        </a>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Contact
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li className="font-semibold text-foreground">
                            {company.legal_name}
                        </li>
                        <li>{company.address_line}</li>
                        <li>
                            {company.zip} {company.city}
                        </li>
                        <li>{company.country}</li>
                        <li>
                            <a
                                href={`tel:${company.phone.replace(/\s/g, '')}`}
                                className="hover:text-primary"
                            >
                                {company.phone}
                            </a>
                        </li>
                        <li>
                            <a
                                href={`mailto:${company.email}`}
                                className="hover:text-primary"
                            >
                                {company.email}
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        Legal
                    </p>
                    <ul className="mt-4 space-y-2 text-sm">
                        {legalLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
                © {year} {company.legal_name}. All rights reserved.
            </div>
        </footer>
    );
}
