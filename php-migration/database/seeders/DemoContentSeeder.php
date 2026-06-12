<?php

namespace Database\Seeders;

use App\Enums\CandidateStatus;
use App\Enums\Plan;
use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Models\Role;
use App\Models\Team;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoContentSeeder extends Seeder
{
    use WithoutModelEvents;

    private const TARGET_ROLES = 12;

    private const TARGET_CANDIDATES = 44;

    /**
     * @var list<string>
     */
    private const ROLE_TITLES = [
        'Senior Backend Engineer',
        'Product Manager',
        'Lead Data Scientist',
        'DevOps Lead',
        'Frontend Engineer',
        'Security Engineer',
        'UX Designer',
        'ML Research Engineer',
        'Engineering Manager',
        'Site Reliability Engineer',
        'Mobile Engineer',
        'Solutions Architect',
    ];

    public function run(): void
    {
        Team::query()->each(function (Team $team): void {
            $this->seedTeam($team);
        });
    }

    private function seedTeam(Team $team): void
    {
        if ($team->plan === Plan::Free) {
            $team->update(['plan' => Plan::Scale]);
        }

        $roles = $this->ensureRoles($team);
        $this->ensureCandidates($team, $roles);
    }

    /**
     * @return list<Role>
     */
    private function ensureRoles(Team $team): array
    {
        $existing = $team->roles()->pluck('title')->all();

        foreach (self::ROLE_TITLES as $title) {
            if ($team->roles()->count() >= self::TARGET_ROLES) {
                break;
            }

            if (in_array($title, $existing, true)) {
                continue;
            }

            $team->roles()->create([
                'title' => $title,
                'description' => $this->roleDescription($title),
            ]);
        }

        return $team->roles()->orderBy('title')->get()->all();
    }

    /**
     * @param  list<Role>  $roles
     */
    private function ensureCandidates(Team $team, array $roles): void
    {
        $existing = $team->candidates()->count();
        $toCreate = self::TARGET_CANDIDATES - $existing;

        if ($toCreate <= 0) {
            return;
        }

        for ($i = 0; $i < $toCreate; $i++) {
            $role = fake()->boolean(80) && $roles !== []
                ? fake()->randomElement($roles)
                : null;

            $candidate = $this->createCandidate($team, $role);
            $this->createTechnicalRoundFor($candidate);
        }
    }

    private function createCandidate(Team $team, ?Role $role): Candidate
    {
        $status = fake()->randomElement([
            CandidateStatus::Complete,
            CandidateStatus::Complete,
            CandidateStatus::Complete,
            CandidateStatus::Complete,
            CandidateStatus::Processing,
            CandidateStatus::Pending,
            CandidateStatus::Failed,
        ]);

        $isComplete = $status === CandidateStatus::Complete;
        $score = $isComplete ? fake()->numberBetween(18, 98) : null;

        return $team->candidates()->create([
            'role_id' => $role?->id,
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'role' => $role?->title ?? fake()->jobTitle(),
            'job_description' => fake()->sentence(12),
            'cv_text' => 'Experienced engineer with backend systems, APIs, and relational database experience.',
            'cv_format' => \App\Enums\CvFormat::Text,
            'status' => $status,
            'integrity_score' => $score,
            'score_breakdown' => $isComplete ? $this->scoreBreakdown($score) : null,
            'follow_up_suggested' => $isComplete && $score < 60
                ? [
                    'Ask the candidate to reproduce a recent technical decision live, without notes.',
                    'Probe the flagged responses with altered parameters to test genuine understanding.',
                ]
                : null,
            'high_inconsistency_warning' => false,
            'error_message' => $status === CandidateStatus::Failed ? 'CV parsing failed: unsupported encoding.' : null,
            'linkedin_url' => fake()->boolean(60) ? 'https://www.linkedin.com/in/'.fake()->userName() : null,
            'github_username' => fake()->boolean(45) ? fake()->userName() : null,
            'processed_at' => $isComplete ? fake()->dateTimeBetween('-40 days', 'now') : null,
        ]);
    }

    private function createTechnicalRoundFor(Candidate $candidate): void
    {
        if ($candidate->status !== CandidateStatus::Complete) {
            return;
        }

        if (fake()->boolean(20)) {
            return;
        }

        $sInt = fake()->numberBetween(25, 95);
        $sId = fake()->numberBetween(25, 95);
        $truncated = fake()->boolean(15);

        InterviewRound::create([
            'candidate_id' => $candidate->id,
            'round_number' => 1,
            'transcript_text' => "Interviewer: Walk me through a recent technical project.\nCandidate: ".fake()->paragraph(),
            'was_truncated' => $truncated,
            'round_scores' => [
                's_int' => $sInt,
                's_id' => $sId,
            ],
            'variance_delta' => null,
            'deep_dive_prompts' => $truncated
                ? ['Re-run the truncated segment with a fresh prompt to confirm reasoning.']
                : null,
        ]);
    }

    /**
     * @return array<string, array{score: int, summary: string}>
     */
    private function scoreBreakdown(int $score): array
    {
        $jitter = fn (): int => max(0, min(100, $score + fake()->numberBetween(-12, 12)));

        return [
            's_cv' => ['score' => $jitter(), 'summary' => 'CV authorship and credential indicators evaluated.'],
            's_int' => ['score' => $jitter(), 'summary' => 'Technical interview signal density assessed.'],
            's_cross' => ['score' => $jitter(), 'summary' => 'Cross-source profile alignment checked.'],
            's_id' => ['score' => $jitter(), 'summary' => 'Identity and provenance indicators consistent.'],
        ];
    }

    private function roleDescription(string $title): string
    {
        return "We are hiring a {$title}. ".fake()->paragraph(4);
    }
}
