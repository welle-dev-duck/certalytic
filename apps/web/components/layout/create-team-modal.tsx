"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { type PropsWithChildren, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CountryCombobox } from "@/features/organizations/components/country-combobox";
import { OrganizationLanguageSelect } from "@/features/organizations/components/organization-language-select";
import {
  createOrganizationFormSchema,
  type OrganizationValues,
} from "@/features/organizations/schemas/organization-settings.schema";
import { authClient } from "@/lib/auth-client";
import {
  ORGANIZATION_COUNTRY_DEFAULT,
} from "@/lib/i18n/countries";
import { ORGANIZATION_LANGUAGE_DEFAULT } from "@/lib/i18n/organization-language";
import { useTranslations } from "@/lib/i18n/client";
import { useAuth } from "@/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";

const CREATE_TEAM_DEFAULTS: OrganizationValues = {
  name: "",
  country: ORGANIZATION_COUNTRY_DEFAULT,
  language: ORGANIZATION_LANGUAGE_DEFAULT,
};

type CreateTeamModalProps = PropsWithChildren<{
  canCreateTeam?: boolean;
}>;

export function CreateTeamModal({
  children,
  canCreateTeam = true,
}: CreateTeamModalProps) {
  const t = useTranslations("app");
  const tSettings = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { refetchOrganizations, switchOrganization } = useAuth();

  const createTeamSchema = useMemo(
    () => createOrganizationFormSchema(tSettings),
    [tSettings],
  );

  const form = useForm<OrganizationValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: CREATE_TEAM_DEFAULTS,
  });

  const { isSubmitting } = form.formState;

  async function handleCreate(values: OrganizationValues) {
    if (!canCreateTeam) {
      toast.error(t("org.createTeam.toast.limitReached"));
      return;
    }

    const result = await authClient.organization.create({
      name: values.name,
      slug: `org-${Date.now()}`,
      country: values.country,
      language: values.language,
      keepCurrentActiveOrganization: false,
    });

    if (result.error) {
      toast.error(result.error.message ?? t("org.createTeam.toast.failed"));
      return;
    }

    const organizationId = result.data?.id;
    if (organizationId) {
      await switchOrganization(organizationId);
    }

    toast.success(t("org.createTeam.toast.created"));
    setOpen(false);
    form.reset(CREATE_TEAM_DEFAULTS);
    refetchOrganizations();
    await queryClient.invalidateQueries();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset(CREATE_TEAM_DEFAULTS);
        }
      }}
    >
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
                    <Required>{t("org.createTeam.nameLabel")}</Required>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="create-team-name"
                    placeholder={t("org.createTeam.namePlaceholder")}
                    required
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="country"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-country">
                    <Required>{tSettings("organizationPage.profileForm.country")}</Required>
                  </FieldLabel>
                  <CountryCombobox
                    id="create-team-country"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder={tSettings(
                      "organizationPage.profileForm.countryPlaceholder",
                    )}
                    searchPlaceholder={tSettings(
                      "organizationPage.profileForm.countrySearchPlaceholder",
                    )}
                    emptyMessage={tSettings(
                      "organizationPage.profileForm.countryEmpty",
                    )}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="language"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-language">
                    <Required>{tSettings("organizationPage.profileForm.language")}</Required>
                  </FieldLabel>
                  <OrganizationLanguageSelect
                    id="create-team-language"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder={tSettings(
                      "organizationPage.profileForm.languagePlaceholder",
                    )}
                  />
                  <FieldDescription>
                    {tSettings("organizationPage.profileForm.languageDescription")}
                  </FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
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
