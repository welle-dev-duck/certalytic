<?php

namespace App\Models;

use App\Enums\RoleDocumentStatus;
use Database\Factories\RoleDocumentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'role_id',
    'original_name',
    'path',
    'extracted_text',
    'ocr_status',
    'sort_order',
])]
class RoleDocument extends Model
{
    /** @use HasFactory<RoleDocumentFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ocr_status' => RoleDocumentStatus::class,
        ];
    }
}
