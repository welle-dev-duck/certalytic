<?php

namespace Tests\Fixtures;

use App\Contracts\CandidateEvaluator;
use App\Contracts\DocumentExtractor;
use App\Contracts\PublicProfileFetcher;
use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Enums\Plan;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Models\Candidate;
use App\Models\Team;
use App\Models\User;
use App\Services\Mistral\MistralCandidateEvaluator;
use App\Services\Mistral\MistralClient;
use App\Services\Mistral\MistralOcrDocumentExtractor;
use App\Services\Storage\SignedStorageUrlService;
use Tests\Fixtures\Contracts\CandidateScenario;
use Tests\Fixtures\MistralHttpFakes;
use Tests\Fixtures\Mocks\ScenarioCandidateEvaluator;
use Tests\Fixtures\Mocks\ScenarioPublicProfileFetcher;

class ScenarioScreeningRunner
{
    public static function run(CandidateScenario $scenario, Team $team): Candidate
    {
        test()->instance(CandidateEvaluator::class, new ScenarioCandidateEvaluator($scenario));
        test()->instance(PublicProfileFetcher::class, new ScenarioPublicProfileFetcher($scenario));

        $candidate = $team->candidates()->create([
            'name' => $scenario->candidateName(),
            'role' => $scenario->role(),
            'job_description' => FixtureLoader::jobDescription(),
            'cv_text' => $scenario->cvText(),
            'cv_format' => CvFormat::Text,
            'linkedin_text' => $scenario->linkedinProfileText(),
            'status' => CandidateStatus::Pending,
        ]);

        foreach ($scenario->transcripts() as $index => $transcript) {
            $candidate->interviewRounds()->create([
                'round_number' => $index + 1,
                'transcript_text' => $transcript,
            ]);
        }

        ProcessCandidateScreeningJob::dispatchSync($candidate);

        return $candidate->fresh(['interviewRounds']);
    }

    public static function fakeMistral(CandidateScenario $scenario): void
    {
        MistralHttpFakes::fake($scenario->mistralChatResponse(), $scenario->cvText());
    }

    public static function teamWithGrowthPlan(): Team
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $team->update(['plan' => Plan::Growth]);

        return $team;
    }

    public static function bindRealMistralServices(): void
    {
        $client = new MistralClient;

        app()->bind(DocumentExtractor::class, fn () => new MistralOcrDocumentExtractor($client, app(SignedStorageUrlService::class)));
        app()->bind(CandidateEvaluator::class, fn () => new MistralCandidateEvaluator($client));
    }
}
