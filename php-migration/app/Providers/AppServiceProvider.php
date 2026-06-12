<?php

namespace App\Providers;

use App\Contracts\CandidateEvaluator;
use App\Contracts\DocumentExtractor;
use App\Contracts\PublicProfileFetcher;
use App\Models\Team;
use App\Services\HttpPublicProfileFetcher;
use App\Services\Mistral\MistralCandidateEvaluator;
use App\Services\Mistral\MistralOcrDocumentExtractor;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DocumentExtractor::class, MistralOcrDocumentExtractor::class);
        $this->app->bind(CandidateEvaluator::class, MistralCandidateEvaluator::class);
        $this->app->bind(PublicProfileFetcher::class, HttpPublicProfileFetcher::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Team::class);
        Cashier::ignoreRoutes();

        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
