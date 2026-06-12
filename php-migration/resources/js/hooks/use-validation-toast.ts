import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

function firstValidationMessage(
    errors: Record<string, string | string[]>,
): string | null {
    for (const value of Object.values(errors)) {
        if (Array.isArray(value) && value[0]) {
            return value[0];
        }

        if (typeof value === 'string' && value !== '') {
            return value;
        }
    }

    return null;
}

export function useValidationToast(): void {
    useEffect(() => {
        const removeErrorListener = router.on('error', (event) => {
            const errors = event.detail?.errors;

            if (!errors || typeof errors !== 'object') {
                return;
            }

            const message = firstValidationMessage(
                errors as Record<string, string | string[]>,
            );

            if (message) {
                toast.error(message);
            }
        });

        const removeHttpExceptionListener = router.on(
            'httpException',
            (event) => {
                const response = event.detail?.response;

                if (response?.status === 429) {
                    toast.error(
                        'Too many requests. Please wait and try again.',
                    );
                }
            },
        );

        return () => {
            removeErrorListener();
            removeHttpExceptionListener();
        };
    }, []);
}
