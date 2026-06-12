<?php

namespace Database\Factories;

use App\Enums\RoleDocumentStatus;
use App\Models\Role;
use App\Models\RoleDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RoleDocument>
 */
class RoleDocumentFactory extends Factory
{
    protected $model = RoleDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role_id' => Role::factory(),
            'original_name' => 'assessment.pdf',
            'path' => 'role-documents/'.fake()->uuid().'.pdf',
            'extracted_text' => fake()->paragraphs(3, true),
            'ocr_status' => RoleDocumentStatus::Complete,
            'sort_order' => 0,
        ];
    }
}
