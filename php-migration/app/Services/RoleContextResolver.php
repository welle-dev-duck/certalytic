<?php

namespace App\Services;

use App\DataTransferObjects\RoleContext;
use App\Enums\RoleDocumentStatus;
use App\Models\Candidate;
use App\Models\Role;

class RoleContextResolver
{
    public function resolve(Candidate $candidate): RoleContext
    {
        $candidate->loadMissing(['jobRole.documents']);

        $jobRole = $candidate->jobRole;

        if ($jobRole instanceof Role) {
            return new RoleContext(
                title: $jobRole->title,
                description: $jobRole->description,
                contextMetadata: $jobRole->context_metadata,
                scanAssets: $jobRole->documents
                    ->where('ocr_status', RoleDocumentStatus::Complete)
                    ->map(fn ($document) => [
                        'name' => $document->original_name,
                        'text' => $document->extracted_text ?? '',
                    ])
                    ->filter(fn (array $asset) => $asset['text'] !== '')
                    ->values()
                    ->all(),
            );
        }

        return new RoleContext(
            title: $candidate->role,
            description: $candidate->job_description,
        );
    }
}
