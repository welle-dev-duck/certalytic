export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? 'space-y-1' : 'mb-2 space-y-1.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'font-display text-lg font-semibold tracking-tight'
                        : 'font-display text-2xl font-semibold tracking-tight'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
