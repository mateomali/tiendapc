<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (! Schema::hasColumn('ordenes', 'garantia_motivo')) {
                $table->text('garantia_motivo')->nullable()->after('cancelado_motivo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (Schema::hasColumn('ordenes', 'garantia_motivo')) {
                $table->dropColumn('garantia_motivo');
            }
        });
    }
};
