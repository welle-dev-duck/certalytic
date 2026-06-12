import { cn } from '@/lib/utils';

type SymProps = {
    name: string;
    className?: string;
    filled?: boolean;
};

/**
 * Material Symbols (Outlined) icon, matching the Google Stitch designs.
 */
export function Sym({ name, className, filled = false }: SymProps) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'material-symbols-outlined',
                filled && 'is-filled',
                className,
            )}
        >
            {name}
        </span>
    );
}
