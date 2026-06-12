<?php

use App\Http\Controllers\Billing\BillingController;
use App\Http\Controllers\Billing\StripeWebhookController;
use App\Http\Controllers\Candidates\BulkImportController;
use App\Http\Controllers\Candidates\CandidateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Roles\RoleController;
use App\Http\Controllers\Tools\ToolsController;
use App\Http\Controllers\Transcriptions\TranscriptionController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Models\Candidate;
use App\Models\Team;
use Illuminate\Support\Facades\Route;
use Laravel\Cashier\Http\Controllers\PaymentController;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('legal')->name('legal.')->group(function () {
    Route::inertia('privacy', 'legal/privacy')->name('privacy');
    Route::inertia('terms', 'legal/terms')->name('terms');
    Route::inertia('dpa', 'legal/dpa')->name('dpa');
    Route::inertia('cookies', 'legal/cookies')->name('cookies');
    Route::inertia('imprint', 'legal/imprint')->name('imprint');
});

Route::prefix(config('cashier.path'))
    ->name('cashier.')
    ->group(function () {
        Route::get('payment/{id}', [PaymentController::class, 'show'])->name('payment');
        Route::post('webhook', [StripeWebhookController::class, 'handleWebhook'])->name('webhook');
    });

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class, 'throttle.sliding:authenticated'])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show');
        Route::patch('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        Route::post('roles/{role}/documents', [RoleController::class, 'storeDocument'])->name('roles.documents.store');
        Route::delete('roles/{role}/documents/{document}', [RoleController::class, 'destroyDocument'])->name('roles.documents.destroy');
        Route::post('roles/{role}/export', [RoleController::class, 'requestExport'])->name('roles.export');
        Route::get('roles/{role}/exports/{roleExport}/download', [RoleController::class, 'downloadExport'])->name('roles.exports.download');

        Route::get('candidates', [CandidateController::class, 'index'])->name('candidates.index');
        Route::get('candidates/create', [CandidateController::class, 'create'])->name('candidates.create');
        Route::post('candidates', [CandidateController::class, 'store'])
            ->middleware('throttle.sliding:screening')
            ->name('candidates.store');
        Route::get('candidates/import', [BulkImportController::class, 'create'])->name('candidates.import.create');
        Route::post('candidates/import', [BulkImportController::class, 'store'])->name('candidates.import.store');
        Route::get('candidates/{candidate}', [CandidateController::class, 'show'])->name('candidates.show');
        Route::post('candidates/{candidate}/rerun', [CandidateController::class, 'rerun'])->name('candidates.rerun');
        Route::delete('candidates/{candidate}', [CandidateController::class, 'destroy'])->name('candidates.destroy');
        Route::get('candidates/{candidate}/export', [CandidateController::class, 'export'])->name('candidates.export');
        Route::get('candidates/{candidate}/cv', [CandidateController::class, 'cv'])->name('candidates.cv');

        Route::get('screenings', fn (Team $current_team) => redirect()->route('candidates.index', $current_team));
        Route::get('screenings/create', fn (Team $current_team) => redirect()->route('candidates.create', $current_team));
        Route::get('screenings/import', fn (Team $current_team) => redirect()->route('candidates.import.create', $current_team));
        Route::get('screenings/{candidate}', fn (Team $current_team, Candidate $candidate) => redirect()->route('candidates.show', [$current_team, $candidate]));
        Route::get('screenings/{candidate}/cv', fn (Team $current_team, Candidate $candidate) => redirect()->route('candidates.cv', [$current_team, $candidate]));

        Route::get('tools', [ToolsController::class, 'index'])->name('tools.index');
        Route::get('tools/transcription', [ToolsController::class, 'transcription'])->name('tools.transcription');
        Route::post('tools/transcribe', [ToolsController::class, 'transcribe'])
            ->middleware('throttle.sliding:transcription')
            ->name('tools.transcribe');
        Route::post('tools/purchase-token', [ToolsController::class, 'purchaseToken'])->name('tools.purchase');
        Route::get('tools/purchase/success', [ToolsController::class, 'purchaseSuccess'])->name('tools.purchase.success');

        Route::get('transcriptions', [TranscriptionController::class, 'index'])->name('transcriptions.index');
        Route::get('transcriptions/{transcription}', [TranscriptionController::class, 'show'])->name('transcriptions.show');
        Route::patch('transcriptions/{transcription}/speakers', [TranscriptionController::class, 'updateSpeakers'])->name('transcriptions.speakers.update');
        Route::delete('transcriptions/{transcription}', [TranscriptionController::class, 'destroy'])->name('transcriptions.destroy');

        Route::get('billing', [BillingController::class, 'index'])->name('billing.index');
        Route::post('billing/subscribe', [BillingController::class, 'subscribe'])->name('billing.subscribe');
        Route::get('billing/portal', [BillingController::class, 'portal'])->name('billing.portal');
        Route::post('billing/packs', [BillingController::class, 'purchasePack'])->name('billing.packs.purchase');
        Route::get('billing/packs/success', [BillingController::class, 'packSuccess'])->name('billing.packs.success');
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
});

require __DIR__.'/settings.php';
