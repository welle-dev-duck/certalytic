<?php

namespace App\Services\Storage;

use Illuminate\Support\Str;

class StoragePathBuilder
{
    public function cv(int $candidateId, string $extension): string
    {
        $safeExtension = strtolower(ltrim($extension, '.'));

        return "cvs/{$candidateId}/".Str::uuid().".{$safeExtension}";
    }

    public function audioForTeam(int $teamId, string $extension): string
    {
        $safeExtension = strtolower(ltrim($extension, '.'));

        return "audio/{$teamId}/".Str::uuid().".{$safeExtension}";
    }

    public function audioForCandidate(int $candidateId, string $extension): string
    {
        $safeExtension = strtolower(ltrim($extension, '.'));

        return "audio/candidates/{$candidateId}/".Str::uuid().".{$safeExtension}";
    }

    public function roleDocument(int $roleId, string $extension): string
    {
        $safeExtension = strtolower(ltrim($extension, '.'));

        return "role-documents/{$roleId}/".Str::uuid().".{$safeExtension}";
    }

    public function transcriptUpload(int $teamId, string $extension): string
    {
        $safeExtension = strtolower(ltrim($extension, '.'));

        return "transcripts/{$teamId}/".Str::uuid().".{$safeExtension}";
    }

    public function roleExport(int $teamId, int $roleId, int $exportId): string
    {
        return "role-exports/{$teamId}/{$roleId}/{$exportId}.pdf";
    }
}
