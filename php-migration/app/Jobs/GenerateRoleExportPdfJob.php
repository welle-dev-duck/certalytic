<?php

namespace App\Jobs;

use App\Enums\RoleExportStatus;
use App\Models\RoleExport;
use App\Services\RoleExportPdfGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateRoleExportPdfJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    /**
     * @var array<int, int>
     */
    public array $backoff = [15, 60];

    public function __construct(public RoleExport $roleExport) {}

    public function handle(RoleExportPdfGenerator $generator): void
    {
        $export = $this->roleExport->fresh(['role.team']);

        if ($export === null) {
            return;
        }

        $export->update(['status' => RoleExportStatus::Processing]);

        try {
            $path = $generator->store($export->role, $export);

            $export->update([
                'status' => RoleExportStatus::Complete,
                'path' => $path,
                'error_message' => null,
                'completed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::error('Role export PDF generation failed', [
                'role_export_id' => $export->id,
                'role_id' => $export->role_id,
                'message' => $exception->getMessage(),
            ]);

            $export->update([
                'status' => RoleExportStatus::Failed,
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}
