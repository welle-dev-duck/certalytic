<?php

use App\Models\User;
use Illuminate\Support\Facades\Gate;

test('non-admin users cannot view horizon in production', function () {
    $this->app['env'] = 'production';

    $user = User::factory()->create();

    expect(Gate::forUser($user)->check('viewHorizon'))->toBeFalse();
});

test('admin users can view horizon in production', function () {
    $this->app['env'] = 'production';

    $user = User::factory()->admin()->create();

    expect(Gate::forUser($user)->check('viewHorizon'))->toBeTrue();
});

test('guests cannot view horizon in production', function () {
    $this->app['env'] = 'production';

    expect(Gate::check('viewHorizon'))->toBeFalse();
});

test('non-admin users cannot view horizon in local', function () {
    $this->app['env'] = 'local';

    $user = User::factory()->create();

    expect(Gate::forUser($user)->check('viewHorizon'))->toBeFalse();
});

test('admin users can view horizon in local', function () {
    $this->app['env'] = 'local';

    $user = User::factory()->admin()->create();

    expect(Gate::forUser($user)->check('viewHorizon'))->toBeTrue();
});
