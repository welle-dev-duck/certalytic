<?php

namespace App\Actions\Roles;

use App\Models\Role;
use App\Models\Team;
use Illuminate\Support\Facades\DB;

class CreateRole
{
    public function handle(Team $team, string $title, ?string $description): Role
    {
        return DB::transaction(fn () => $team->roles()->create([
            'title' => $title,
            'description' => $description,
        ]));
    }
}
