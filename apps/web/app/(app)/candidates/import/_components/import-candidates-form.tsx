"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link"
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useImportCandidates } from "@/features/candidates/hooks/use-candidates";
import { parseImportCsv } from "@/features/candidates/lib/parse-import-csv";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { routes } from "@/lib/routes";

const importSchema = z.object({
  roleId: z.string().uuid("Select a role"),
  csv: z.string().min(1, "Paste or upload CSV content"),
});

type ImportValues = z.infer<typeof importSchema>;

export function ImportCandidatesForm() {
  const router = useRouter();
  const importCandidates = useImportCandidates();
  const { data: usage } = useBillingUsage();
  const { data: rolesData } = useRoles({ limit: 100 });

  const roles = useMemo(
    () => rolesData?.pages.flatMap((page) => page.data) ?? [],
    [rolesData],
  );

  const form = useForm<ImportValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { roleId: "", csv: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: ImportValues) {
    let rows;

    try {
      rows = parseImportCsv(values.csv);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not parse CSV.",
      );
      return;
    }

    if (rows.length === 0) {
      toast.error("No valid rows found. Each row needs name and transcript.");
      return;
    }

    if (rows.length > 50) {
      toast.error("Maximum 50 rows per import.");
      return;
    }

    await importCandidates.mutateAsync(
      { role_id: values.roleId, rows },
      {
        onSuccess: (result) => {
          toast.success(`Queued ${result.queued} screening(s).`);
          router.push(routes.candidates());
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Import failed.",
          );
        },
      },
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      form.setValue("csv", text, { shouldValidate: true });
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Bulk import</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          CSV upload · {usage?.available ?? 0} token(s) available
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <FieldGroup>
          <Controller
            name="roleId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Role</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role for imported candidates" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="csv-file">CSV file</FieldLabel>
            <input
              id="csv-file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Columns: name, email (optional), transcript
            </p>
          </Field>

          <Controller
            name="csv"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="csv-content">CSV content</FieldLabel>
                <Textarea
                  {...field}
                  id="csv-content"
                  rows={10}
                  placeholder={`name,email,transcript\nJane Doe,jane@example.com,"Interview transcript text..."`}
                  className="font-mono text-xs"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <LoadingSwap isLoading={isSubmitting}>Import</LoadingSwap>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={routes.candidates()}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
