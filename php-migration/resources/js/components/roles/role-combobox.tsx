import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { JobRole } from '@/types/roles';

type Props = {
    roles: JobRole[];
    value: number | null;
    onChange: (roleId: number | null) => void;
    placeholder?: string;
    allLabel?: string;
    className?: string;
};

export default function RoleCombobox({
    roles,
    value,
    onChange,
    placeholder = 'Filter by role…',
    allLabel = 'All roles',
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selectedLabel = useMemo(() => {
        if (value === null) {
            return allLabel;
        }

        return roles.find((role) => role.id === value)?.title ?? allLabel;
    }, [allLabel, roles, value]);

    const filteredRoles = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (term === '') {
            return roles;
        }

        return roles.filter((role) =>
            role.title.toLowerCase().includes(term),
        );
    }, [query, roles]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-9 w-full cursor-pointer justify-between px-3 text-xs font-medium sm:w-52',
                        className,
                    )}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-64 p-2"
                onCloseAutoFocus={(event) => event.preventDefault()}
            >
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={placeholder}
                    className="mb-2 h-8 text-xs"
                    onKeyDown={(event) => event.stopPropagation()}
                />
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    <DropdownMenuItem
                        className="cursor-pointer gap-2 text-xs"
                        onSelect={() => {
                            onChange(null);
                            setOpen(false);
                            setQuery('');
                        }}
                    >
                        <Check
                            className={cn(
                                'size-3.5 shrink-0',
                                value === null ? 'opacity-100' : 'opacity-0',
                            )}
                        />
                        {allLabel}
                    </DropdownMenuItem>
                    {filteredRoles.map((role) => (
                        <DropdownMenuItem
                            key={role.id}
                            className="cursor-pointer gap-2 text-xs"
                            onSelect={() => {
                                onChange(role.id);
                                setOpen(false);
                                setQuery('');
                            }}
                        >
                            <Check
                                className={cn(
                                    'size-3.5 shrink-0',
                                    value === role.id
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                )}
                            />
                            <span className="truncate">{role.title}</span>
                        </DropdownMenuItem>
                    ))}
                    {filteredRoles.length === 0 && (
                        <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                            No roles match your search.
                        </p>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
