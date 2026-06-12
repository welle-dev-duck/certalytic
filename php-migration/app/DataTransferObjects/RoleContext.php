<?php

namespace App\DataTransferObjects;

readonly class RoleContext
{
    /**
     * @param  array<int, array{name: string, text: string}>  $scanAssets
     * @param  array<string, mixed>|null  $contextMetadata
     */
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?array $contextMetadata = null,
        public array $scanAssets = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toPromptArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'context_metadata' => $this->contextMetadata,
            'scan_assets' => $this->scanAssets,
        ];
    }
}
