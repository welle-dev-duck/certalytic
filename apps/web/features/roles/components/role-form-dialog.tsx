"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";
import {
  useCreateRole,
  useUpdateRole,
} from "@/features/roles/hooks/use-roles";
import type { RoleListItem } from "@/features/roles/types";

const titleMax = SCREENING_LIMITS.role_title_max_characters;
const descriptionMax = SCREENING_LIMITS.role_description_max_characters;

const roleSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(titleMax),
  description: z.string().max(descriptionMax).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  role?: RoleListItem | null;
};

export function RoleFormDialog({
  open,
  onOpenChange,
  mode,
  role,
}: RoleFormDialogProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? "");

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { title: "", description: "" },
  });

  const { isSubmitting } = form.formState;
  const titleValue = form.watch("title");
  const descriptionValue = form.watch("description") ?? "";

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: role?.title ?? "",
      description: role?.description ?? "",
    });
  }, [open, role, form]);

  async function onSubmit(values: RoleFormValues) {
    const mutation = mode === "create" ? createRole : updateRole;

    mutation.mutate(
      {
        title: values.title,
        description: values.description || null,
      },
      {
        onSuccess: () => {
          toast.success(mode === "create" ? "Role created." : "Role updated.");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Something went wrong.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create role" : "Edit role"}
          </DialogTitle>
          <DialogDescription>
            Define the role title and job description used to contextualize
            technical interview integrity scoring.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <FieldGroup className="flex-1 space-y-5 overflow-y-auto pr-1">
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-title">Title</FieldLabel>
                  <Input
                    {...field}
                    id="role-title"
                    maxLength={titleMax}
                    placeholder="Senior Backend Engineer"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {titleValue.length.toLocaleString()} /{" "}
                    {titleMax.toLocaleString()} characters max
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-description">
                    Job description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="role-description"
                    maxLength={descriptionMax}
                    rows={6}
                    className="min-h-[140px]"
                    placeholder="Requirements, seniority expectations, and role context for AI scoring."
                  />
                  <p className="text-xs text-muted-foreground">
                    {descriptionValue.length.toLocaleString()} /{" "}
                    {descriptionMax.toLocaleString()} characters max
                  </p>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !titleValue.trim()}
            >
              <LoadingSwap isLoading={isSubmitting}>
                {mode === "create" ? "Create role" : "Save changes"}
              </LoadingSwap>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
