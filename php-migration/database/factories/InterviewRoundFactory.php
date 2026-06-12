<?php

namespace Database\Factories;

use App\Models\Candidate;
use App\Models\InterviewRound;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InterviewRound>
 */
class InterviewRoundFactory extends Factory
{
    protected $model = InterviewRound::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'candidate_id' => Candidate::factory(),
            'round_number' => 1,
            'transcript_text' => "Interviewer: Tell me about your recent project.\nCandidate: I led a Laravel migration at Acme Corp.",
            'was_truncated' => false,
        ];
    }
}
