import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { destroy as destroyScreening } from '@/routes/candidates';

type CandidateRef = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: CandidateRef | null;
    teamSlug: string;
    onDeleted?: () => void;
};

export default function DeleteCandidateDialog({
    open,
    onOpenChange,
    candidate,
    teamSlug,
    onDeleted,
}: Props) {
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = () => {
        if (!candidate) {
            return;
        }

        setDeleting(true);

        router.delete(destroyScreening.url([teamSlug, candidate.id]), {
            preserveScroll: true,
            onSuccess: () => {
                onDeleted?.();
            },
            onFinish: () => {
                setDeleting(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!deleting) {
                    onOpenChange(nextOpen);
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Delete candidate?</DialogTitle>
                    <DialogDescription>
                        {candidate ? (
                            <>
                                This will permanently delete{' '}
                                <span className="font-semibold text-foreground">
                                    {candidate.name}
                                </span>
                                , including interview transcripts and integrity
                                scores. This action cannot be undone.
                            </>
                        ) : (
                            'This action cannot be undone.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={confirmDelete}
                        disabled={deleting || candidate === null}
                    >
                        {deleting ? 'Deleting…' : 'Delete candidate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
