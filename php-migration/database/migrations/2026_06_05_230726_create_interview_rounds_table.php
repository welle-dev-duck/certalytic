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
        Schema::create('interview_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('round_number');
            $table->text('transcript_text');
            $table->boolean('was_truncated')->default(false);
            $table->json('round_scores')->nullable();
            $table->decimal('variance_delta', 5, 2)->nullable();
            $table->json('deep_dive_prompts')->nullable();
            $table->timestamps();

            $table->unique(['candidate_id', 'round_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('interview_rounds');
    }
};
