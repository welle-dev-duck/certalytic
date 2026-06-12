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
import { rerun as rerunScreening } from '@/routes/candidates';

type CandidateRef = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: CandidateRef | null;
    teamSlug: string;
};

export default function RerunCandidateDialog({
    open,
    onOpenChange,
    candidate,
    teamSlug,
}: Props) {
    const [processing, setProcessing] = useState(false);

    const confirmRerun = () => {
        if (!candidate) {
            return;
        }

        setProcessing(true);

        router.post(rerunScreening.url([teamSlug, candidate.id]), {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) {
                    onOpenChange(nextOpen);
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Re-run screening?</DialogTitle>
                    <DialogDescription>
                        {candidate ? (
                            <>
                                This will re-analyze{' '}
                                <span className="font-semibold text-foreground">
                                    {candidate.name}
                                </span>{' '}
                                using the stored CV and merged interview
                                transcripts. The current integrity score will
                                be replaced. This consumes{' '}
                                <span className="font-semibold text-foreground">
                                    1 token
                                </span>
                                .
                            </>
                        ) : (
                            'Re-running replaces the current analysis and consumes 1 token.'
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={confirmRerun}
                        disabled={processing || candidate === null}
                    >
                        {processing ? 'Re-queuing…' : 'Re-run screening'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
