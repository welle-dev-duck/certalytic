<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonApplicationServiceProvider;

class HorizonServiceProvider extends HorizonApplicationServiceProvider
{
    /**
     * Configure the Horizon authorization services.
     */
    protected function authorization(): void
    {
        $this->gate();

        Horizon::auth(function ($request): bool {
            return Gate::check('viewHorizon', [$request->user()]);
        });
    }

    /**
     * Register the Horizon gate.
     *
     * This gate determines who can access Horizon in all environments.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function (?User $user = null): bool {
            return $user?->isAdmin() ?? false;
        });
    }
}
