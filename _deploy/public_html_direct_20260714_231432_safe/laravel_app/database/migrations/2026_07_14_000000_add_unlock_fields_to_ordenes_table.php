<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (! Schema::hasColumn('ordenes', 'unlock_type')) {
                $table->string('unlock_type', 20)->nullable()->after('color');
            }

            if (! Schema::hasColumn('ordenes', 'unlock_value')) {
                $table->string('unlock_value', 80)->nullable()->after('unlock_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (Schema::hasColumn('ordenes', 'unlock_value')) {
                $table->dropColumn('unlock_value');
            }

            if (Schema::hasColumn('ordenes', 'unlock_type')) {
                $table->dropColumn('unlock_type');
            }
        });
    }
};
