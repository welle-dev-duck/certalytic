"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "@/components/ui/link"
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Required } from "@/components/required";
import { useCreateCandidate } from "@/features/candidates/hooks/use-candidates";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { routes } from "@/lib/routes";

const createCandidateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  role_id: z.string().uuid("Select a role"),
  cv: z
    .custom<FileList>((value) => value instanceof FileList && value.length > 0, {
      message: "CV file is required",
    }),
  transcript: z.string().trim().min(10, "Transcript is required"),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().optional(),
});

type CreateCandidateValues = z.infer<typeof createCandidateSchema>;

export function CreateCandidateForm() {
  const router = useRouter();
  const createCandidate = useCreateCandidate();
  const { data: usage } = useBillingUsage();
  const { data: rolesData } = useRoles({ limit: 100 });

  const roles = rolesData?.pages.flatMap((page) => page.data) ?? [];

  const form = useForm<CreateCandidateValues>({
    resolver: zodResolver(createCandidateSchema),
    defaultValues: {
      name: "",
      email: "",
      role_id: roles[0]?.id ?? "",
      transcript: "",
      linkedin_url: "",
      github_url: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: CreateCandidateValues) {
    const formData = new FormData();
    formData.set("name", values.name);
    if (values.email) formData.set("email", values.email);
    formData.set("role_id", values.role_id);
    formData.set("cv_input_mode", "auto");
    formData.set("transcript_input_mode", "manual");
    formData.set("merged_transcript", values.transcript);

    const cvFile = values.cv.item(0);
    if (cvFile) formData.set("cv", cvFile);

    if (values.linkedin_url) formData.set("linkedin_url", values.linkedin_url);
    if (values.github_url) formData.set("github_url", values.github_url);

    createCandidate.mutate(formData, {
      onSuccess: (result) => {
        toast.success("Screening started.");
        router.push(routes.candidate(result.id));
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to create candidate.",
        );
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">New candidate</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {usage?.available ?? 0} token(s) available
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-name">
                  <Required>Name</Required>
                </FieldLabel>
                <Input {...field} id="candidate-name" required />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-email">Email</FieldLabel>
                <Input {...field} id="candidate-email" type="email" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="role_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-role">
                  <Required>Role</Required>
                </FieldLabel>
                <select
                  id="candidate-role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  value={field.value}
                  onChange={field.onChange}
                >
                  {roles.length === 0 ? (
                    <option value="">No roles — create one first</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                      </option>
                    ))
                  )}
                </select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="cv"
            control={form.control}
            render={({ field: { onChange }, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-cv">
                  <Required>CV (PDF)</Required>
                </FieldLabel>
                <Input
                  id="candidate-cv"
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(event) => onChange(event.target.files)}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="transcript"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-transcript">
                  <Required>Interview transcript</Required>
                </FieldLabel>
                <Textarea {...field} id="candidate-transcript" rows={8} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="linkedin_url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-linkedin">
                  LinkedIn URL
                </FieldLabel>
                <Input {...field} id="candidate-linkedin" type="url" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="github_url"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="candidate-github">GitHub URL</FieldLabel>
                <Input {...field} id="candidate-github" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || roles.length === 0}>
            <LoadingSwap isLoading={isSubmitting}>
              Start screening
            </LoadingSwap>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.candidates()}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
