import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ApiValidationErrors } from "@/lib/api-client";

export function applyApiValidationErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  errors: ApiValidationErrors,
): void {
  for (const [field, messages] of Object.entries(errors)) {
    const message = messages[0];

    if (!message) continue;

    form.setError(field as Path<T>, { type: "server", message });
  }
}
