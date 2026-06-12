<?php

namespace App\Models;

use App\Enums\TranscriptionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'team_id',
    'user_id',
    'status',
    'audio_path',
    'original_filename',
    'transcript_text',
    'segments',
    'speaker_labels',
    'error_message',
    'duration_seconds',
])]
class AudioTranscription extends Model
{
    /** @use HasFactory<\Database\Factories\AudioTranscriptionFactory> */
    use HasFactory;
    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TranscriptionStatus::class,
            'segments' => 'array',
            'speaker_labels' => 'array',
        ];
    }
}
