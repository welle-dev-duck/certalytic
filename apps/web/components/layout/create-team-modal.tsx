"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { type PropsWithChildren, useState } from "react";
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
import { useAuth } from "@/providers/auth-provider";

const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

type CreateTeamModalProps = PropsWithChildren<{
  canCreateTeam?: boolean;
}>;

export function CreateTeamModal({
  children,
  canCreateTeam = true,
}: CreateTeamModalProps) {
  const [open, setOpen] = useState(false);
  const { activeOrganization, refetchOrganizations } = useAuth();

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "" },
  });

  const { isSubmitting } = form.formState;

  async function handleCreate(values: CreateTeamValues) {
    if (!canCreateTeam) {
      toast.error("Team limit reached.");
      return;
    }

    const slug = values.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const result = await authClient.organization.create({
      name: values.name,
      slug: slug || `team-${Date.now()}`,
      keepCurrentActiveOrganization: Boolean(activeOrganization),
    });

    if (result.error) {
      toast.error(result.error.message ?? "Failed to create team.");
      return;
    }

    toast.success("Team created.");
    await authClient.getSession();
    refetchOrganizations();
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(handleCreate)}>
          <DialogHeader>
            <DialogTitle>Create a new team</DialogTitle>
            <DialogDescription>
              Create a new team to collaborate with others.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-name">Team name</FieldLabel>
                  <Input
                    {...field}
                    id="create-team-name"
                    placeholder="My team"
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
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  Create team
                </span>
              </LoadingSwap>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
