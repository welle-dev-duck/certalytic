<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;
use App\Services\PlanFeatures;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->currentTeam !== null
            && app(PlanFeatures::class)->can($user->currentTeam, 'saved_roles');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->belongsToTeam($role->team)
            && app(PlanFeatures::class)->can($role->team, 'saved_roles');
    }

    public function create(User $user): bool
    {
        return $user->currentTeam !== null
            && app(PlanFeatures::class)->can($user->currentTeam, 'saved_roles');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->belongsToTeam($role->team)
            && app(PlanFeatures::class)->can($role->team, 'saved_roles');
    }

    public function delete(User $user, Role $role): bool
    {
        return $user->belongsToTeam($role->team)
            && app(PlanFeatures::class)->can($role->team, 'saved_roles');
    }

    public function uploadDocument(User $user, Role $role): bool
    {
        return $user->belongsToTeam($role->team)
            && app(PlanFeatures::class)->can($role->team, 'role_context_assets');
    }
}
