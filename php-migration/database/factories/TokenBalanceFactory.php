<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\TokenBalance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TokenBalance>
 */
class TokenBalanceFactory extends Factory
{
    protected $model = TokenBalance::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'included_used' => 0,
            'pack_balance' => 0,
        ];
    }
}
