import { Link, usePage } from '@inertiajs/react';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import { register } from '@/routes';

type Props = {
    appName: string;
};

export default function MarketingHeader({ appName }: Props) {
    const { auth, currentTeam } = usePage().props;
    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';

    return (
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center border border-primary bg-primary/10">
                        <Scale size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-bold tracking-wide">
                        {appName}
                    </span>
                </Link>
                <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
                    <a href="/#how-it-works" className="hover:text-foreground">
                        How it works
                    </a>
                    <a href="/#product" className="hover:text-foreground">
                        Product
                    </a>
                    <a href="/#demo" className="hover:text-foreground">
                        Demo
                    </a>
                    <a href="/#pricing" className="hover:text-foreground">
                        Pricing
                    </a>
                    <a href="/#reviews" className="hover:text-foreground">
                        Reviews
                    </a>
                    <a href="/#roadmap" className="hover:text-foreground">
                        Roadmap
                    </a>
                </nav>
                <div className="flex items-center gap-2">
                    {auth.user ? (
                        <Button size="sm" asChild>
                            <Link href={dashboardUrl}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={login()}>Log in</Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href={register()}>Start free</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
