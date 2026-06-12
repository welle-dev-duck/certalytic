<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(2, true),
            'context_metadata' => null,
        ];
    }
}
