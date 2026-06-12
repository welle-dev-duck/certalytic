"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link"
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
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { useAuth } from "@/providers/auth-provider";

const teamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100),
});

type TeamValues = z.infer<typeof teamSchema>;

export function TeamEdit({ teamId }: { teamId: string }) {
  const { organizations, refetchOrganizations } = useAuth();
  const team = organizations.find((org) => org.id === teamId);

  const form = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    values: { name: team?.name ?? "" },
  });

  const { isSubmitting } = form.formState;

  if (!team) {
    return (
      <p className="text-sm text-muted-foreground">Team not found.</p>
    );
  }

  async function onSubmit(values: TeamValues) {
    const result = await authClient.organization.update({
      organizationId: teamId,
      data: { name: values.name },
    });

    if (result.error) {
      toast.error(result.error.message ?? "Failed to update team.");
      return;
    }

    toast.success("Team updated.");
    refetchOrganizations();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Edit team</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{team.slug}</p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="team-name">Team name</FieldLabel>
                <Input {...field} id="team-name" required />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            <LoadingSwap isLoading={isSubmitting}>Save</LoadingSwap>
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={routes.settingsTeams()}>Back</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
