<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ordenes') || Schema::hasColumn('ordenes', 'color')) {
            return;
        }

        Schema::table('ordenes', function (Blueprint $table): void {
            $table->string('color', 80)->nullable()->after('modelo');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('ordenes') || ! Schema::hasColumn('ordenes', 'color')) {
            return;
        }

        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropColumn('color');
        });
    }
};
