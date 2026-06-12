"use client";

import { FileDropzone } from "@/components/file-dropzone";
import { Required } from "@/components/required";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";
import type { RoleListItem } from "@/features/roles/types";

type CandidateStepProps = ScreeningStepProps & {
  selectedRole: RoleListItem | undefined;
  lockRole: boolean;
  cvTextWords: number;
  onChangeRole: () => void;
};

export function CandidateStep({
  form,
  errors,
  updateForm,
  selectedRole,
  lockRole,
  cvTextWords,
  onChangeRole,
}: CandidateStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="screen-name">
            <Required>Name</Required>
          </Label>
          <Input
            id="screen-name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
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
            onChange={(event) => updateForm("email", event.target.value)}
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
            onClick={onChangeRole}
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
            updateForm("cvInputMode", value as ScreeningStepProps["form"]["cvInputMode"])
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
              onFileChange={(nextFile) => updateForm("cvFile", nextFile)}
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
              onChange={(event) => updateForm("cvText", event.target.value)}
              maxLength={SCREENING_LIMITS.cv_text_max_characters}
              rows={8}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder="Paste the candidate CV content here (min. 50 characters)…"
            />
            <p className="text-xs text-muted-foreground">
              {form.cvText.length.toLocaleString()} /{" "}
              {SCREENING_LIMITS.cv_text_max_characters.toLocaleString()}{" "}
              characters · {cvTextWords.toLocaleString()} /{" "}
              {SCREENING_LIMITS.cv_text_max_words.toLocaleString()} words max
            </p>
            {errors.cv_text ? (
              <p className="text-sm text-destructive">{errors.cv_text}</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
