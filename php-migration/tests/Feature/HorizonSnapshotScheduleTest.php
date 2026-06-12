<?php

use Illuminate\Console\Scheduling\Schedule;

test('horizon snapshot is scheduled every five minutes', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($event) => str_contains($event->command ?? '', 'horizon:snapshot'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('*/5 * * * *');
});
