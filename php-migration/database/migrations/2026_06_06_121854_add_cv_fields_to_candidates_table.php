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
        Schema::table('candidates', function (Blueprint $table) {
            $table->string('role')->nullable()->after('email');
            $table->text('job_description')->nullable()->after('role');
            $table->text('cv_text')->nullable()->after('cv_path');
            $table->string('cv_format')->nullable()->after('cv_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn(['role', 'job_description', 'cv_text', 'cv_format']);
        });
    }
};
