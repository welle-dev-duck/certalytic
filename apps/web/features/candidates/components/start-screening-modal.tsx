"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "@/components/ui/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/file-dropzone";
import { LoadingSwap } from "@/components/loading-swap";
import { Required } from "@/components/required";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlanFeatures } from "@/features/billing/lib/plan-features";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { useCreateCandidate } from "@/features/candidates/hooks/use-candidates";
import {
  MAX_TRANSCRIPT_FILES,
  SCREENING_LIMITS,
} from "@/features/candidates/lib/screening-limits";
import {
  createScreeningSchema,
  firstZodError,
  formatZodErrors,
} from "@/features/candidates/lib/screening-schema";
import { useRoles } from "@/features/roles/hooks/use-roles";
import type { RoleListItem } from "@/features/roles/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type StartScreeningModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRoleId?: string | null;
  lockRole?: boolean;
};

type FormState = {
  name: string;
  email: string;
  roleId: string | null;
  cvInputMode: "auto" | "manual";
  cvFile: File | null;
  cvText: string;
  linkedinText: string;
  githubUrl: string;
  transcriptInputMode: "manual" | "auto";
  mergedTranscript: string;
  transcriptFiles: File[];
  interviewerNotes: string;
};

const steps = [
  { id: 1, title: "Role", description: "Choose the position" },
  { id: 2, title: "Candidate", description: "Details & CV" },
  { id: 3, title: "Cross-ref", description: "LinkedIn & GitHub" },
  { id: 4, title: "Interviews", description: "Merged transcripts" },
];

function buildInitialFormState(
  roles: RoleListItem[],
  preselectedRoleId?: string | null,
  lockRole = false,
): FormState {
  const selected = roles.find((role) => role.id === preselectedRoleId);

  return {
    name: "",
    email: "",
    roleId: lockRole
      ? (selected?.id ?? preselectedRoleId ?? null)
      : (selected?.id ?? roles[0]?.id ?? null),
    cvInputMode: "auto",
    cvFile: null,
    cvText: "",
    linkedinText: "",
    githubUrl: "",
    transcriptInputMode: "manual",
    mergedTranscript: "",
    transcriptFiles: [],
    interviewerNotes: "",
  };
}

export function StartScreeningModal({
  open,
  onOpenChange,
  preselectedRoleId = null,
  lockRole = false,
}: StartScreeningModalProps) {
  const router = useRouter();
  const createCandidate = useCreateCandidate();
  const { data: usage } = useBillingUsage();
  const { data: rolesData } = useRoles(
    { limit: 100, page: 1 },
    { enabled: open },
  );
  const roles = rolesData?.data ?? [];

  const planFeatures = getPlanFeatures(usage?.plan);
  const canUseProfileUrls =
    planFeatures.crossSource || planFeatures.crossSourceManual;

  const initialStep = lockRole ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(() =>
    buildInitialFormState(roles, preselectedRoleId, lockRole),
  );

  const screeningSchema = useMemo(
    () => createScreeningSchema(SCREENING_LIMITS),
    [],
  );

  const selectedRole = roles.find((role) => role.id === form.roleId);
  const mergedTranscriptWords = form.mergedTranscript.trim()
    ? form.mergedTranscript.trim().split(/\s+/).length
    : 0;
  const cvTextWords = form.cvText.trim()
    ? form.cvText.trim().split(/\s+/).length
    : 0;

  useEffect(() => {
    if (!open) return;
    setStep(lockRole ? 2 : 1);
    setErrors({});
    setForm(buildInitialFormState(roles, preselectedRoleId, lockRole));
    // Reset only when the dialog opens — roles is memoized from query data.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roles read at open time
  }, [open, preselectedRoleId, lockRole]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const hasCv =
    form.cvInputMode === "auto"
      ? form.cvFile !== null
      : form.cvText.trim().length >= 50;

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return form.roleId !== null;
      case 2:
        return form.name.trim() !== "" && hasCv;
      case 3:
        return true;
      case 4:
        return form.transcriptInputMode === "manual"
          ? form.mergedTranscript.trim().length >= 10
          : form.transcriptFiles.length > 0;
      default:
        return true;
    }
  }

  function submit() {
    const parsed = screeningSchema.safeParse({
      name: form.name,
      email: form.email,
      roleId: form.roleId,
      cvInputMode: form.cvInputMode,
      cvFile: form.cvFile,
      cvText: form.cvText,
      linkedinText: form.linkedinText,
      githubUrl: form.githubUrl,
      transcriptInputMode: form.transcriptInputMode,
      mergedTranscript: form.mergedTranscript,
      transcriptFiles: form.transcriptFiles,
      interviewerNotes: form.interviewerNotes,
    });

    if (!parsed.success) {
      const fieldErrors = formatZodErrors(parsed.error);
      setErrors(fieldErrors);
      toast.error(firstZodError(parsed.error));
      return;
    }

    if (form.roleId === null) return;

    const payload = new FormData();
    payload.set("name", form.name.trim());
    payload.set("role_id", form.roleId);
    payload.set("cv_input_mode", form.cvInputMode);

    if (form.email.trim()) {
      payload.set("email", form.email.trim());
    }

    if (form.cvInputMode === "auto" && form.cvFile) {
      payload.set("cv", form.cvFile);
    }

    if (form.cvInputMode === "manual") {
      payload.set("cv_text", form.cvText.trim());
    }

    if (canUseProfileUrls && form.linkedinText.trim()) {
      payload.set("linkedin_text", form.linkedinText.trim());
    }

    if (canUseProfileUrls && form.githubUrl.trim()) {
      payload.set("github_url", form.githubUrl.trim());
    }

    payload.set("transcript_input_mode", form.transcriptInputMode);

    if (form.transcriptInputMode === "manual") {
      payload.set("transcripts[0]", form.mergedTranscript.trim());
    } else {
      for (const file of form.transcriptFiles) {
        payload.append("transcript_files", file);
      }
    }

    if (form.interviewerNotes.trim()) {
      payload.set("interviewer_notes[0]", form.interviewerNotes.trim());
    }

    setErrors({});

    createCandidate.mutate(payload, {
      onSuccess: (result) => {
        toast.success("Screening started.");
        onOpenChange(false);
        router.push(routes.candidate(result.id));
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to start screening.",
        );
      },
    });
  }

  const processing = createCandidate.isPending;
  const tokenAvailable = usage?.available ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Screen candidate</DialogTitle>
          <DialogDescription>
            {tokenAvailable} token(s) available
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 px-1">
          {steps.map((item, itemIndex) => {
            const isComplete = lockRole
              ? item.id === 1 || step > item.id
              : step > item.id;
            const isActive = step === item.id;

            return (
              <div key={item.id} className="flex flex-1 items-center gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isComplete
                          ? "bg-primary/80 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      item.id
                    )}
                  </span>
                  <div className="hidden sm:block">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                {itemIndex < steps.length - 1 ? (
                  <div
                    className={cn(
                      "h-px flex-1",
                      isComplete ? "bg-primary/60" : "bg-border",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {Object.keys(errors).length > 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              {Object.values(errors).filter(Boolean).join(" ")}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 && !lockRole ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a saved role to contextualize the integrity score.
              </p>

              {roles.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Create a role profile before screening candidates.
                  </p>
                  <Button asChild className="mt-3" size="sm">
                    <Link href={routes.roles()}>Go to Roles</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roles.map((role) => {
                    const selected = form.roleId === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => updateForm("roleId", role.id)}
                        className={cn(
                          "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {role.title}
                          </span>
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {role.candidatesCount} candidate
                          {role.candidatesCount === 1 ? "" : "s"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.roleId ? (
                <p className="text-sm text-destructive">{errors.roleId}</p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="screen-name">
                    <Required>Name</Required>
                  </Label>
                  <Input
                    id="screen-name"
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    maxLength={SCREENING_LIMITS.name_max_characters}
                    required
                  />
                  {errors.name ? (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="screen-email">Email</Label>
                  <Input
                    id="screen-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    maxLength={SCREENING_LIMITS.email_max_characters}
                  />
                  {errors.email ? (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Applying for</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedRole?.title ?? "No role selected"}
                </p>
                {!lockRole ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-auto px-0"
                    onClick={() => setStep(1)}
                  >
                    Change role
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label>
                  <Required>CV / Résumé</Required>
                </Label>
                <Tabs
                  value={form.cvInputMode}
                  onValueChange={(value) =>
                    updateForm("cvInputMode", value as FormState["cvInputMode"])
                  }
                >
                  <TabsList>
                    <TabsTrigger value="auto">Upload</TabsTrigger>
                    <TabsTrigger value="manual">Paste text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="auto" className="space-y-2 pt-2">
                    <p className="text-sm text-muted-foreground">
                      PDF, Word (.docx), or Markdown. Max{" "}
                      {Math.round(SCREENING_LIMITS.cv_max_kilobytes / 1024)} MB.
                    </p>
                    <FileDropzone
                      accept=".pdf,.doc,.docx,.md,.markdown,.txt"
                      file={form.cvFile}
                      onFileChange={(nextFile) =>
                        updateForm("cvFile", nextFile)
                      }
                      description="or click to browse"
                      aria-invalid={Boolean(errors.cv)}
                    />
                    {errors.cv ? (
                      <p className="text-sm text-destructive">{errors.cv}</p>
                    ) : null}
                  </TabsContent>
                  <TabsContent value="manual" className="space-y-2 pt-2">
                    <textarea
                      value={form.cvText}
                      onChange={(event) =>
                        updateForm("cvText", event.target.value)
                      }
                      maxLength={SCREENING_LIMITS.cv_text_max_characters}
                      rows={8}
                      className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                      placeholder="Paste the candidate CV content here (min. 50 characters)…"
                    />
                    <p className="text-xs text-muted-foreground">
                      {form.cvText.length.toLocaleString()} /{" "}
                      {SCREENING_LIMITS.cv_text_max_characters.toLocaleString()}{" "}
                      characters · {cvTextWords.toLocaleString()} /{" "}
                      {SCREENING_LIMITS.cv_text_max_words.toLocaleString()}{" "}
                      words max
                    </p>
                    {errors.cv_text ? (
                      <p className="text-sm text-destructive">
                        {errors.cv_text}
                      </p>
                    ) : null}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Optional cross-reference signals strengthen the integrity score
                by comparing the CV against public profiles.
              </p>

              {canUseProfileUrls ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="screen-linkedin-text">
                      LinkedIn profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Paste the candidate&apos;s LinkedIn profile content here.
                    </p>
                    <textarea
                      id="screen-linkedin-text"
                      value={form.linkedinText}
                      onChange={(event) =>
                        updateForm("linkedinText", event.target.value)
                      }
                      maxLength={
                        SCREENING_LIMITS.linkedin_text_max_characters
                      }
                      rows={6}
                      className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                      placeholder="Paste headline, experience, education, and skills from the LinkedIn profile…"
                    />
                    {errors.linkedin_text ? (
                      <p className="text-sm text-destructive">
                        {errors.linkedin_text}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="screen-github-url">GitHub profile</Label>
                    <Input
                      id="screen-github-url"
                      type="url"
                      value={form.githubUrl}
                      onChange={(event) =>
                        updateForm("githubUrl", event.target.value)
                      }
                      maxLength={SCREENING_LIMITS.github_url_max_characters}
                      placeholder="https://github.com/username"
                    />
                    {errors.github_url ? (
                      <p className="text-sm text-destructive">
                        {errors.github_url}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Cross-reference screening requires a Starter plan or higher.
                    You can skip this step and continue with CV and interview
                    analysis only.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add interview transcripts as pasted text or uploaded files.
                Multiple files are merged into one dossier for analysis.
              </p>

              <div className="space-y-3 border border-border p-4">
                <Tabs
                  value={form.transcriptInputMode}
                  onValueChange={(value) =>
                    updateForm(
                      "transcriptInputMode",
                      value as FormState["transcriptInputMode"],
                    )
                  }
                >
                  <TabsList>
                    <TabsTrigger value="manual">Paste text</TabsTrigger>
                    <TabsTrigger value="auto">Upload file</TabsTrigger>
                  </TabsList>
                  <TabsContent value="manual" className="space-y-2 pt-2">
                    <Label htmlFor="merged-transcript">
                      <Required>Interview transcript</Required>
                    </Label>
                    <textarea
                      id="merged-transcript"
                      value={form.mergedTranscript}
                      onChange={(event) =>
                        updateForm("mergedTranscript", event.target.value)
                      }
                      rows={8}
                      className="flex min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                      placeholder="Paste transcript from Zoom, Teams, or other sources…"
                    />
                    <p className="text-xs text-muted-foreground">
                      {form.mergedTranscript.length.toLocaleString()} /{" "}
                      {SCREENING_LIMITS.transcript_text_max_characters.toLocaleString()}{" "}
                      characters · {mergedTranscriptWords.toLocaleString()} /{" "}
                      {SCREENING_LIMITS.transcript_text_max_words.toLocaleString()}{" "}
                      words max
                    </p>
                    {errors["transcripts.0"] || errors.transcripts ? (
                      <p className="text-sm text-destructive">
                        {errors["transcripts.0"] ?? errors.transcripts}
                      </p>
                    ) : null}
                  </TabsContent>
                  <TabsContent value="auto" className="space-y-2 pt-2">
                    <Label htmlFor="transcript-files">
                      <Required>Transcript files</Required>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload up to {MAX_TRANSCRIPT_FILES} Zoom .vtt captions or
                      Teams .docx exports.
                    </p>
                    <FileDropzone
                      id="transcript-files"
                      accept=".vtt,.docx"
                      multiple
                      files={form.transcriptFiles}
                      onFilesChange={(nextFiles) =>
                        updateForm(
                          "transcriptFiles",
                          nextFiles.slice(0, MAX_TRANSCRIPT_FILES),
                        )
                      }
                      description="or click to browse (up to 3 files)"
                      aria-invalid={Boolean(errors.transcript_files)}
                    />
                    {errors.transcript_files ? (
                      <p className="text-sm text-destructive">
                        {errors.transcript_files}
                      </p>
                    ) : null}
                  </TabsContent>
                </Tabs>

                <div className="grid gap-2 pt-2">
                  <Label htmlFor="interviewer-notes">Internal notes</Label>
                  <textarea
                    id="interviewer-notes"
                    value={form.interviewerNotes}
                    onChange={(event) =>
                      updateForm("interviewerNotes", event.target.value)
                    }
                    maxLength={
                      SCREENING_LIMITS.interviewer_notes_max_characters
                    }
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                    placeholder="Private recruiter observations…"
                  />
                  {errors["interviewer_notes.0"] ? (
                    <p className="text-sm text-destructive">
                      {errors["interviewer_notes.0"]}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (step === 1 || (lockRole && step === 2)) {
                onOpenChange(false);
              } else {
                setStep((current) => current - 1);
              }
            }}
            disabled={processing}
          >
            {step === 1 || (lockRole && step === 2) ? "Cancel" : "Back"}
          </Button>
          {step < steps.length ? (
            <Button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={processing || !canProceed()}
            >
              <LoadingSwap isLoading={processing}>
                Start screening
              </LoadingSwap>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
