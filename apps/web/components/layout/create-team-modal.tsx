"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { type PropsWithChildren, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { LoadingSwap } from "@/components/loading-swap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useTranslations } from "@/lib/i18n/client";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";

type CreateTeamValues = {
  name: string;
};

type CreateTeamModalProps = PropsWithChildren<{
  canCreateTeam?: boolean;
}>;

export function CreateTeamModal({
  children,
  canCreateTeam = true,
}: CreateTeamModalProps) {
  const t = useTranslations("app");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { refetchOrganizations } = useAuth();

  const createTeamSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t("org.createTeam.validation.nameRequired"))
          .max(100),
      }),
    [t],
  );

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "" },
  });

  const { isSubmitting } = form.formState;

  async function handleCreate(values: CreateTeamValues) {
    if (!canCreateTeam) {
      toast.error(t("org.createTeam.toast.limitReached"));
      return;
    }

    const result = await authClient.organization.create({
      name: values.name,
      slug: `org-${Date.now()}`,
      keepCurrentActiveOrganization: false,
    });

    if (result.error) {
      toast.error(result.error.message ?? t("org.createTeam.toast.failed"));
      return;
    }

    toast.success(t("org.createTeam.toast.created"));
    setOpen(false);
    form.reset();
    refetchOrganizations();
    await queryClient.invalidateQueries();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(handleCreate)}>
          <DialogHeader>
            <DialogTitle>{t("org.createTeam.title")}</DialogTitle>
            <DialogDescription>
              {t("org.createTeam.description")}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-name">
                    {t("org.createTeam.nameLabel")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="create-team-name"
                    placeholder={t("org.createTeam.namePlaceholder")}
                    required
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("org.createTeam.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  {t("org.createTeam.submit")}
                </span>
              </LoadingSwap>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
