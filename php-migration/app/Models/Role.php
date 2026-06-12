<?php

namespace App\Models;

use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['team_id', 'title', 'description', 'context_metadata'])]
class Role extends Model
{
    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Team, $this>
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * @return HasMany<Candidate, $this>
     */
    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }

    /**
     * @return HasMany<RoleDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(RoleDocument::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<RoleExport, $this>
     */
    public function exports(): HasMany
    {
        return $this->hasMany(RoleExport::class)->latest();
    }

    /**
     * Interview rounds across every candidate screened for this role.
     *
     * @return HasManyThrough<InterviewRound, Candidate, $this>
     */
    public function interviewRounds(): HasManyThrough
    {
        return $this->hasManyThrough(InterviewRound::class, Candidate::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'context_metadata' => 'array',
        ];
    }
}
