<?php

namespace App\Models;

use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use Database\Factories\CandidateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'team_id',
    'role_id',
    'name',
    'email',
    'role',
    'job_description',
    'cv_path',
    'cv_text',
    'cv_format',
    'linkedin_url',
    'github_username',
    'linkedin_text',
    'github_text',
    'status',
    'cv_analysis_results',
    'integrity_score',
    'score_breakdown',
    'follow_up_suggested',
    'high_inconsistency_warning',
    'error_message',
    'processed_at',
])]
class Candidate extends Model
{
    /** @use HasFactory<CandidateFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function jobRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * @return HasMany<InterviewRound, $this>
     */
    public function interviewRounds(): HasMany
    {
        return $this->hasMany(InterviewRound::class)->orderBy('round_number');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => CandidateStatus::class,
            'cv_format' => CvFormat::class,
            'cv_analysis_results' => 'array',
            'score_breakdown' => 'array',
            'follow_up_suggested' => 'array',
            'high_inconsistency_warning' => 'boolean',
            'integrity_score' => 'decimal:2',
            'processed_at' => 'datetime',
        ];
    }
}
