<?php

test('legal pages can be rendered', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    ['legal.privacy', 'legal/privacy'],
    ['legal.terms', 'legal/terms'],
    ['legal.dpa', 'legal/dpa'],
    ['legal.cookies', 'legal/cookies'],
    ['legal.imprint', 'legal/imprint'],
]);

test('welcome page shares company and social links', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('company.legal_name')
            ->has('socialLinks.linkedin')
            ->has('marketing.stats.candidates_screened')
            ->has('marketing.pricing.plans', 3)
            ->has('marketing.roadmap', 4));
});
