<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ordenes', 'tracking_disabled')) {
            Schema::table('ordenes', fn (Blueprint $table) => $table->boolean('tracking_disabled')->default(false));
        }
    }

    public function down(): void
    {
        Schema::table('ordenes', fn (Blueprint $table) => $table->dropColumn('tracking_disabled'));
    }
};
