import type { ZodError } from 'zod';

export function formatZodErrors(error: ZodError): Record<string, string> {
    const result: Record<string, string> = {};

    for (const issue of error.issues) {
        const path = issue.path.join('.');

        if (!result[path]) {
            result[path] = issue.message;
        }
    }

    return result;
}

export function firstZodError(error: ZodError): string {
    return error.issues[0]?.message ?? 'Please fix the highlighted fields.';
}
