<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('transcript_text');
            $table->string('transcription_status')->nullable()->after('audio_path');
        });
    }

    public function down(): void
    {
        Schema::table('interview_rounds', function (Blueprint $table) {
            $table->dropColumn(['audio_path', 'transcription_status']);
        });
    }
};
