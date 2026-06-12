import { useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store, update } from '@/routes/roles';
import type { JobRole } from '@/types/roles';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamSlug: string;
    mode: 'create' | 'edit';
    role?: JobRole;
};

export default function RoleFormDialog({
    open,
    onOpenChange,
    teamSlug,
    mode,
    role,
}: Props) {
    const { fieldLimits } = usePage<{
        fieldLimits?: {
            role_title_max_characters: number;
            role_description_max_characters: number;
        };
    }>().props;

    const titleMax = fieldLimits?.role_title_max_characters ?? 255;
    const descriptionMax =
        fieldLimits?.role_description_max_characters ?? 20_000;

    const form = useForm({
        title: role?.title ?? '',
        description: role?.description ?? '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        form.setData({
            title: role?.title ?? '',
            description: role?.description ?? '',
        });
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, role?.id]);

    const submit = () => {
        const options = { onSuccess: () => onOpenChange(false) };

        if (mode === 'create') {
            form.post(store.url(teamSlug), options);
        } else {
            form.patch(update.url([teamSlug, role!.id]), options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create role' : 'Edit role'}
                    </DialogTitle>
                    <DialogDescription>
                        Define the role title and job description used to
                        contextualize technical interview integrity scoring.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-5 overflow-y-auto pr-1">
                    <div className="grid gap-2">
                        <Label htmlFor="role-title">Title</Label>
                        <Input
                            id="role-title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            maxLength={titleMax}
                            placeholder="Senior Backend Engineer"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            {form.data.title.length.toLocaleString()} /{' '}
                            {titleMax.toLocaleString()} characters max
                        </p>
                        <InputError message={form.errors.title} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role-description">Job description</Label>
                        <textarea
                            id="role-description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            maxLength={descriptionMax}
                            rows={6}
                            className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                            placeholder="Requirements, seniority expectations, and role context for AI scoring."
                        />
                        <p className="text-xs text-muted-foreground">
                            {form.data.description.length.toLocaleString()} /{' '}
                            {descriptionMax.toLocaleString()} characters max
                        </p>
                        <InputError message={form.errors.description} />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={form.processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={submit}
                        disabled={form.processing || !form.data.title.trim()}
                    >
                        {form.processing
                            ? 'Saving…'
                            : mode === 'create'
                              ? 'Create role'
                              : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
