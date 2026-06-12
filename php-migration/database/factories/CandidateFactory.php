<?php

namespace Database\Factories;

use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Models\Candidate;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Candidate>
 */
class CandidateFactory extends Factory
{
    protected $model = Candidate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'cv_text' => 'Experienced software engineer with backend systems, APIs, and relational database experience.',
            'cv_format' => CvFormat::Text,
            'status' => CandidateStatus::Pending,
        ];
    }

    public function complete(): static
    {
        return $this->state(fn () => [
            'status' => CandidateStatus::Complete,
            'integrity_score' => fake()->randomFloat(2, 40, 95),
            'processed_at' => now(),
            'score_breakdown' => [
                's_cv' => ['score' => 76, 'summary' => 'CV indicators within expected range.'],
                's_int' => ['score' => 68, 'summary' => 'Interview signal density moderate.'],
                's_cross' => ['score' => 50, 'summary' => 'Cross-source not evaluated.'],
                's_id' => ['score' => 80, 'summary' => 'Identity indicators consistent.'],
            ],
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn () => [
            'status' => CandidateStatus::Processing,
        ]);
    }
}
