<?php

namespace App\Actions\Roles;

use App\Models\Role;
use Illuminate\Support\Facades\DB;

class UpdateRole
{
    public function handle(Role $role, string $title, ?string $description): Role
    {
        return DB::transaction(function () use ($role, $title, $description) {
            $role->update([
                'title' => $title,
                'description' => $description,
            ]);

            return $role->fresh();
        });
    }
}
