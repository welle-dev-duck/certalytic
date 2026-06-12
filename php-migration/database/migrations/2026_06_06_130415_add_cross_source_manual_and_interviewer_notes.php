<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->text('linkedin_text')->nullable()->after('github_username');
            $table->text('github_text')->nullable()->after('linkedin_text');
        });

        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->text('interviewer_notes')->nullable()->after('transcript_text');
        });
    }

    public function down(): void
    {
        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->dropColumn('interviewer_notes');
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn(['linkedin_text', 'github_text']);
        });
    }
};
