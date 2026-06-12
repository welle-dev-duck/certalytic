<?php

namespace Database\Factories;

use App\Enums\TranscriptionStatus;
use App\Models\AudioTranscription;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AudioTranscription>
 */
class AudioTranscriptionFactory extends Factory
{
    protected $model = AudioTranscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'user_id' => User::factory(),
            'status' => TranscriptionStatus::Complete,
            'audio_path' => null,
            'original_filename' => fake()->randomElement(['interview.mp3', 'panel-call.m4a', 'screen.wav']),
            'transcript_text' => "Speaker 1: Thanks for joining today.\nSpeaker 2: Happy to be here.",
            'segments' => [
                ['speaker_id' => 'speaker_0', 'text' => 'Thanks for joining today.', 'start' => 0.0, 'end' => 2.4],
                ['speaker_id' => 'speaker_1', 'text' => 'Happy to be here.', 'start' => 2.5, 'end' => 4.1],
            ],
            'speaker_labels' => [
                'speaker_0' => 'Speaker 1',
                'speaker_1' => 'Speaker 2',
            ],
            'error_message' => null,
            'duration_seconds' => 240,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'status' => TranscriptionStatus::Pending,
            'transcript_text' => null,
            'segments' => null,
            'speaker_labels' => null,
        ]);
    }
}
