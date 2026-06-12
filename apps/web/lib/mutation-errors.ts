import type { FieldValues, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { ApiError, type ApiValidationErrors } from "@/lib/api-client";
import { applyApiValidationErrors } from "@/lib/form-errors";

type HandleMutationErrorOptions<T extends FieldValues> = {
  form?: UseFormReturn<T>;
  fallbackMessage?: string;
};

export function mapValidationErrors(
  errors: ApiValidationErrors,
): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const [field, messages] of Object.entries(errors)) {
    if (messages[0]) {
      mapped[field] = messages[0];
    }
  }

  return mapped;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function handleMutationError<T extends FieldValues>(
  error: unknown,
  options: HandleMutationErrorOptions<T> = {},
): void {
  const { form, fallbackMessage = "Something went wrong." } = options;

  if (error instanceof ApiError && form) {
    const validationErrors = error.validationErrors;

    if (validationErrors) {
      applyApiValidationErrors(form, validationErrors);
      toast.error(error.message);
      return;
    }
  }

  toast.error(getErrorMessage(error, fallbackMessage));
}
