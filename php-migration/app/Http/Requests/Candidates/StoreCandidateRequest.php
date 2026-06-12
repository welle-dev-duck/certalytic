<?php

namespace App\Http\Requests\Candidates;

use App\DataTransferObjects\StartCandidateScreeningData;
use App\Enums\CvFormat;
use App\Services\CaptionFileParser;
use App\Services\PlanFeatures;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\Storage\StoragePathBuilder;
use App\Services\TextContentLimiter;
use App\Services\TokenService;
use App\Services\TranscriptMerger;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->currentTeam !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $team = $this->user()?->currentTeam;
        $cvMaxKb = config('certalytic.limits.cv_max_kilobytes');
        $transcriptFileMaxKb = config('certalytic.limits.transcript_file_max_kilobytes');

        return [
            'name' => ['required', 'string', 'max:'.config('certalytic.limits.name_max_characters')],
            'email' => ['nullable', 'email:rfc', 'max:'.config('certalytic.limits.email_max_characters')],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(fn ($query) => $query->where('team_id', $team?->id)),
            ],
            'cv_input_mode' => ['required', Rule::in(['auto', 'manual'])],
            'cv' => [
                Rule::requiredIf(fn () => $this->input('cv_input_mode') === 'auto'),
                'nullable',
                File::types(['pdf', 'doc', 'docx', 'md', 'markdown', 'txt'])->max($cvMaxKb),
            ],
            'cv_text' => [
                Rule::requiredIf(fn () => $this->input('cv_input_mode') === 'manual'),
                'nullable',
                'string',
                'min:50',
                'max:'.config('certalytic.limits.cv_text_max_characters'),
            ],
            'transcript_input_mode' => ['required', Rule::in(['manual', 'auto'])],
            'transcripts' => [
                Rule::requiredIf(fn () => $this->input('transcript_input_mode') === 'manual'),
                'nullable',
                'array',
                'size:1',
            ],
            'transcripts.0' => [
                'required_with:transcripts',
                'string',
                'min:10',
                'max:'.config('certalytic.limits.transcript_text_max_characters'),
            ],
            'transcript_files' => [
                Rule::requiredIf(fn () => $this->input('transcript_input_mode') === 'auto'),
                'nullable',
                'array',
                'min:1',
                'max:'.config('certalytic.transcript.max_transcript_files', 3),
            ],
            'transcript_files.*' => [
                File::types(['vtt', 'docx'])->max($transcriptFileMaxKb),
            ],
            'interviewer_notes' => ['nullable', 'array', 'max:1'],
            'interviewer_notes.0' => ['nullable', 'string', 'max:'.config('certalytic.limits.interviewer_notes_max_characters')],
            'linkedin_text' => ['nullable', 'string', 'max:'.config('certalytic.limits.linkedin_text_max_characters')],
            'linkedin_url' => ['nullable', 'url', 'max:'.config('certalytic.limits.github_url_max_characters')],
            'github_url' => ['nullable', 'url', 'max:'.config('certalytic.limits.github_url_max_characters')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cv.required' => 'Upload a CV file or switch to manual text input.',
            'cv.max' => 'CV file must not exceed '.number_format(config('certalytic.limits.cv_max_kilobytes') / 1024, 0).' MB.',
            'cv_text.required' => 'Paste CV content or switch to file upload.',
            'email.email' => 'Enter a valid email address.',
            'transcript_files.required' => 'Upload at least one transcript file or switch to manual paste.',
            'transcript_files.min' => 'Upload at least one transcript file.',
            'transcript_files.max' => 'You can upload up to '.config('certalytic.transcript.max_transcript_files', 3).' transcript files.',
            'transcript_files.*.mimes' => 'Upload a Zoom .vtt caption file or a Teams .docx export.',
            'transcript_files.*.extensions' => 'Upload a Zoom .vtt caption file or a Teams .docx export.',
            'transcripts.required' => 'Interview transcript is required.',
            'transcripts.size' => 'Paste one interview transcript.',
            'transcripts.0.required' => 'Paste an interview transcript.',
            'transcripts.0.min' => 'Transcript must be at least 10 characters.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $team = $this->user()?->currentTeam;

            if ($team === null) {
                return;
            }

            $planFeatures = app(PlanFeatures::class);
            $tokenService = app(TokenService::class);
            $textLimiter = app(TextContentLimiter::class);

            if (! $tokenService->canConsume($team)) {
                $validator->errors()->add('tokens', 'Insufficient tokens. Upgrade your plan or purchase a token pack.');
            }

            if ($this->input('cv_input_mode') === 'manual' && $this->filled('cv_text')) {
                $limited = $textLimiter->limitCvText($this->input('cv_text'));

                if ($limited['was_truncated']) {
                    $validator->errors()->add(
                        'cv_text',
                        'CV text exceeds the maximum of '.number_format(config('certalytic.limits.cv_text_max_words')).' words.',
                    );
                }
            }

            if ($this->input('transcript_input_mode') === 'manual' && is_string($this->input('transcripts.0'))) {
                $limited = $textLimiter->limitTranscriptText(trim($this->input('transcripts.0')));

                if ($limited['was_truncated']) {
                    $validator->errors()->add(
                        'transcripts',
                        'Transcript exceeds the maximum of '.number_format(config('certalytic.limits.transcript_text_max_words')).' words.',
                    );
                }
            }

            if ($this->input('transcript_input_mode') === 'auto') {
                $this->validateTranscriptUploads($validator, $textLimiter);
            }

            $canUseCrossSource = $planFeatures->can($team, 'cross_source_manual')
                || $planFeatures->can($team, 'cross_source');

            if (! $canUseCrossSource && $this->filled('linkedin_text')) {
                $validator->errors()->add('linkedin_text', 'LinkedIn cross-check requires a Starter plan or higher.');
            }

            if (! $canUseCrossSource && $this->filled('linkedin_url')) {
                $validator->errors()->add('linkedin_url', 'LinkedIn cross-check requires a Starter plan or higher.');
            }

            if (! $canUseCrossSource && $this->filled('github_url')) {
                $validator->errors()->add('github_url', 'GitHub cross-check requires a Starter plan or higher.');
            }

            if ($this->filled('github_url') && $this->parseGithubUsername($this->input('github_url')) === null) {
                $validator->errors()->add('github_url', 'Enter a valid GitHub profile URL (e.g. https://github.com/username).');
            }

            if ($this->filled('github_username') || $this->filled('github_text')) {
                $validator->errors()->add('github_text', 'GitHub cross-check is not available in this MVP.');
            }

            if (! $planFeatures->can($team, 'saved_roles')) {
                $validator->errors()->add('role_id', 'Saved roles require a Starter plan or higher.');
            }
        });
    }

    public function toDto(): StartCandidateScreeningData
    {
        $cvText = null;
        $cvFormat = null;
        $cvFile = null;

        if ($this->input('cv_input_mode') === 'manual') {
            $cvText = $this->validated('cv_text');
            $cvFormat = CvFormat::Text;
        } elseif ($this->file('cv') instanceof UploadedFile) {
            $cvFile = $this->file('cv');
            $cvFormat = $this->resolveFileFormat($cvFile->getClientOriginalExtension());
        }

        [$transcripts, $audioPath, $requiresAudioTranscription] = $this->resolveTranscriptPayload();

        /** @var array<int, string|null> $rawNotes */
        $rawNotes = array_values($this->input('interviewer_notes', []));
        $interviewerNotes = [];

        foreach (array_keys($transcripts) as $index) {
            $note = $rawNotes[$index] ?? null;
            $interviewerNotes[$index] = is_string($note) && trim($note) !== '' ? trim($note) : null;
        }

        return new StartCandidateScreeningData(
            name: $this->validated('name'),
            email: $this->validated('email'),
            roleId: $this->validated('role_id'),
            role: null,
            jobDescription: null,
            cvFile: $cvFile,
            cvText: $cvText,
            cvFormat: $cvFormat,
            linkedinUrl: $this->normalizeOptionalText($this->validated('linkedin_url')),
            githubUsername: $this->parseGithubUsername($this->validated('github_url')),
            linkedinText: $this->normalizeOptionalText($this->validated('linkedin_text')),
            githubText: null,
            transcripts: $transcripts,
            interviewerNotes: $interviewerNotes,
            transcriptAudioPath: $audioPath,
            requiresAudioTranscription: $requiresAudioTranscription,
        );
    }

    /**
     * @return array{0: array<int, string>, 1: ?string, 2: bool}
     */
    private function resolveTranscriptPayload(): array
    {
        if ($this->input('transcript_input_mode') === 'manual') {
            $text = trim($this->validated('transcripts.0'));

            return [[$text], null, false];
        }

        $files = $this->transcriptUploadFiles();

        if ($files === []) {
            return [[''], null, false];
        }

        $segments = array_map(
            fn (UploadedFile $file): string => $this->parseUploadedTranscriptFile($file),
            $files,
        );

        $merged = app(TranscriptMerger::class)->merge($segments);

        return [[$merged], null, false];
    }

    /**
     * @return list<UploadedFile>
     */
    private function transcriptUploadFiles(): array
    {
        /** @var array<int, mixed> $files */
        $files = $this->file('transcript_files', []);

        return array_values(array_filter(
            $files,
            fn (mixed $file): bool => $file instanceof UploadedFile,
        ));
    }

    private function parseUploadedTranscriptFile(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $pathBuilder = app(StoragePathBuilder::class);
        $storage = app(SignedStorageUrlService::class);
        $uploadPath = $pathBuilder->transcriptUpload($this->user()->currentTeam->id, $extension);
        $storage->put($uploadPath, $file->get());

        $parser = app(CaptionFileParser::class);
        $text = $parser->parseUploadedPath($uploadPath, $extension);
        $storage->delete($uploadPath);

        return $text;
    }

    private function validateTranscriptUploads(Validator $validator, TextContentLimiter $textLimiter): void
    {
        $files = $this->transcriptUploadFiles();

        if ($files === []) {
            return;
        }

        $captionMaxKb = config('certalytic.limits.transcript_file_max_kilobytes');

        foreach ($files as $index => $file) {
            if ($file->getSize() > $captionMaxKb * 1024) {
                $validator->errors()->add(
                    "transcript_files.{$index}",
                    'Transcript file exceeds the maximum size of '.number_format($captionMaxKb).' KB.',
                );
            }
        }

        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        try {
            $segments = array_map(
                fn (UploadedFile $file): string => $this->parseUploadedTranscriptFile($file),
                $files,
            );
        } catch (\Throwable) {
            $validator->errors()->add('transcript_files', 'One or more transcript files could not be read.');

            return;
        }

        $merged = app(TranscriptMerger::class)->merge($segments);
        $limited = $textLimiter->limitTranscriptText($merged);

        if ($limited['was_truncated']) {
            $validator->errors()->add(
                'transcript_files',
                'Combined transcript exceeds the maximum of '.number_format(config('certalytic.limits.transcript_text_max_words')).' words.',
            );
        }
    }

    private function normalizeOptionalText(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        return trim($value);
    }

    private function parseGithubUsername(mixed $url): ?string
    {
        if (! is_string($url) || trim($url) === '') {
            return null;
        }

        if (preg_match('#(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)/?(?:\?.*)?$#i', trim($url), $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function resolveFileFormat(string $extension): CvFormat
    {
        return match (strtolower($extension)) {
            'pdf' => CvFormat::Pdf,
            'doc', 'docx' => CvFormat::Docx,
            'md', 'markdown' => CvFormat::Markdown,
            default => CvFormat::Markdown,
        };
    }
}
