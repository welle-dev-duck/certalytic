<?php

namespace App\DataTransferObjects;

use App\Enums\CvFormat;
use Illuminate\Http\UploadedFile;

readonly class StartCandidateScreeningData
{
    /**
     * @param  array<int, string>  $transcripts
     * @param  array<int, string|null>  $interviewerNotes
     */
    public function __construct(
        public string $name,
        public ?string $email,
        public ?int $roleId,
        public ?string $role,
        public ?string $jobDescription,
        public ?UploadedFile $cvFile,
        public ?string $cvText,
        public ?CvFormat $cvFormat,
        public ?string $linkedinUrl,
        public ?string $githubUsername,
        public ?string $linkedinText,
        public ?string $githubText,
        public array $transcripts,
        public array $interviewerNotes,
        public ?string $transcriptAudioPath = null,
        public bool $requiresAudioTranscription = false,
    ) {}
}
