<?php

namespace App\Services\Storage;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class SignedStorageUrlService
{
    public function disk(): Filesystem
    {
        return Storage::disk(config('certalytic.storage.disk'));
    }

    public function temporaryUrl(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        $disk = $this->disk();

        if (! $disk->exists($path)) {
            return null;
        }

        $expiresAt = now()->addMinutes(config('certalytic.storage.signed_url_ttl_minutes', 15));

        return $disk->temporaryUrl($path, $expiresAt);
    }

    public function put(string $path, mixed $contents, array $options = []): bool
    {
        return $this->disk()->put($path, $contents, array_merge([
            'visibility' => 'private',
        ], $options));
    }

    public function delete(?string $path): bool
    {
        if ($path === null || trim($path) === '') {
            return false;
        }

        return $this->disk()->delete($path);
    }

    public function get(?string $path): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        return $this->disk()->get($path);
    }
}
