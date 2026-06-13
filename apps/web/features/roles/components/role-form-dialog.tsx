"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
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
import { useTranslations } from "@/lib/i18n/client";
import { handleMutationError } from "@/lib/mutation-errors";

const titleMax = SCREENING_LIMITS.role_title_max_characters;
const descriptionMax = SCREENING_LIMITS.role_description_max_characters;

type RoleFormValues = {
  title: string;
  description: string;
};

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
  const t = useTranslations("app");
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id ?? "");

  const roleSchema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(1, t("roles.form.validation.titleRequired"))
          .max(titleMax),
        description: z
          .string()
          .trim()
          .min(1, t("roles.form.validation.descriptionRequired"))
          .max(descriptionMax),
      }),
    [t],
  );

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
        description: values.description,
      },
      {
        onSuccess: () => {
          toast.success(
            mode === "create"
              ? t("roles.form.toast.created")
              : t("roles.form.toast.updated"),
          );
          onOpenChange(false);
        },
        onError: (error) => {
          handleMutationError(error, {
            fallbackMessage: "Something went wrong.",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="gap-1">
          <DialogTitle>
            {mode === "create"
              ? t("roles.form.createTitle")
              : t("roles.form.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("roles.form.description")}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <FieldGroup className="flex-1 space-y-3 overflow-y-auto pr-1">
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="role-title">
                    <Required>{t("roles.form.titleLabel")}</Required>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="role-title"
                    maxLength={titleMax}
                    placeholder={t("roles.form.titlePlaceholder")}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("roles.form.titleMax", {
                      current: titleValue.length,
                      max: titleMax,
                    })}
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
                <Field
                  data-invalid={fieldState.invalid}
                  className="pb-6"
                >
                  <FieldLabel htmlFor="role-description">
                    <Required>{t("roles.form.descriptionLabel")}</Required>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="role-description"
                    maxLength={descriptionMax}
                    rows={6}
                    className="min-h-[140px]"
                    placeholder={t("roles.form.descriptionPlaceholder")}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("roles.form.descriptionMax", {
                      current: descriptionValue.length,
                      max: descriptionMax,
                    })}
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
              {t("roles.form.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !titleValue.trim() ||
                !descriptionValue.trim()
              }
            >
              <LoadingSwap isLoading={isSubmitting}>
                {mode === "create"
                  ? t("roles.form.create")
                  : t("roles.form.save")}
              </LoadingSwap>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
