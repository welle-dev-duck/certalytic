<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('cv_path')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_username')->nullable();
            $table->string('status')->default('pending');
            $table->json('cv_analysis_results')->nullable();
            $table->decimal('integrity_score', 5, 2)->nullable();
            $table->json('score_breakdown')->nullable();
            $table->json('follow_up_suggested')->nullable();
            $table->boolean('high_inconsistency_warning')->default(false);
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
