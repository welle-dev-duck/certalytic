import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'text-brand font-medium underline decoration-brand/30 underline-offset-4 transition-colors duration-150 hover:decoration-brand',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
