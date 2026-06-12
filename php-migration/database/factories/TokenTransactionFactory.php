<?php

namespace Database\Factories;

use App\Enums\TokenTransactionType;
use App\Models\Team;
use App\Models\TokenTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TokenTransaction>
 */
class TokenTransactionFactory extends Factory
{
    protected $model = TokenTransaction::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'candidate_id' => null,
            'amount' => -1,
            'type' => TokenTransactionType::Included,
        ];
    }
}
