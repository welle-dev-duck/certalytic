<?php

namespace App\Jobs;

use App\Contracts\DocumentExtractor;
use App\Enums\RoleDocumentStatus;
use App\Models\RoleDocument;
use App\Services\LocalCvReader;
use App\Services\Storage\SignedStorageUrlService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessRoleDocumentJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    public function __construct(public RoleDocument $document) {}

    public function handle(
        DocumentExtractor $documentExtractor,
        LocalCvReader $localCvReader,
        SignedStorageUrlService $storage,
    ): void {
        $document = $this->document->fresh();

        if ($document === null) {
            return;
        }

        $document->update(['ocr_status' => RoleDocumentStatus::Processing]);

        try {
            $extension = strtolower(pathinfo($document->path, PATHINFO_EXTENSION));

            $text = match ($extension) {
                'pdf' => $documentExtractor->extractText($document->path),
                'doc', 'docx' => $this->readDocx($storage, $document->path, $localCvReader),
                'md', 'markdown', 'txt' => $this->readPlainText($storage, $document->path),
                default => throw new \RuntimeException('Unsupported role document format.'),
            };

            $document->update([
                'extracted_text' => $text,
                'ocr_status' => RoleDocumentStatus::Complete,
            ]);
        } catch (Throwable $exception) {
            Log::error('Role document OCR failed', [
                'role_document_id' => $document->id,
                'message' => $exception->getMessage(),
            ]);

            $document->update(['ocr_status' => RoleDocumentStatus::Failed]);

            throw $exception;
        }
    }

    private function readDocx(SignedStorageUrlService $storage, string $path, LocalCvReader $localCvReader): string
    {
        $contents = $storage->get($path);

        if ($contents === null) {
            throw new \RuntimeException("Role document not found at path: {$path}");
        }

        return $localCvReader->readDocxFromContents($contents);
    }

    private function readPlainText(SignedStorageUrlService $storage, string $path): string
    {
        $contents = $storage->get($path);

        if ($contents === null || trim($contents) === '') {
            throw new \RuntimeException("Role document not found or empty at path: {$path}");
        }

        return $contents;
    }
}
