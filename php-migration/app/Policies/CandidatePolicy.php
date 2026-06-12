<?php

namespace App\Policies;

use App\Models\Candidate;
use App\Models\User;

class CandidatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentTeam !== null;
    }

    public function view(User $user, Candidate $candidate): bool
    {
        return $user->belongsToTeam($candidate->team);
    }

    public function create(User $user): bool
    {
        return $user->currentTeam !== null;
    }

    public function update(User $user, Candidate $candidate): bool
    {
        return $user->belongsToTeam($candidate->team);
    }

    public function delete(User $user, Candidate $candidate): bool
    {
        return $user->belongsToTeam($candidate->team);
    }

    public function addRound(User $user, Candidate $candidate): bool
    {
        return $user->belongsToTeam($candidate->team);
    }
}
