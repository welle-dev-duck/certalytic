<?php

namespace App\Models;

use App\Enums\TranscriptionStatus;
use Database\Factories\InterviewRoundFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'candidate_id',
    'round_number',
    'transcript_text',
    'audio_path',
    'transcription_status',
    'interviewer_notes',
    'was_truncated',
    'round_scores',
    'variance_delta',
    'deep_dive_prompts',
])]
class InterviewRound extends Model
{
    /** @use HasFactory<InterviewRoundFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Candidate, $this>
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'was_truncated' => 'boolean',
            'transcription_status' => TranscriptionStatus::class,
            'round_scores' => 'array',
            'variance_delta' => 'decimal:2',
            'deep_dive_prompts' => 'array',
        ];
    }
}
