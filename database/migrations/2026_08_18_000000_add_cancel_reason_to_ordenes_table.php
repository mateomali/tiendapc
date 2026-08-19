<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (! Schema::hasColumn('ordenes', 'cancelado_motivo')) {
                $table->text('cancelado_motivo')->nullable()->after('archivado_motivo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            if (Schema::hasColumn('ordenes', 'cancelado_motivo')) {
                $table->dropColumn('cancelado_motivo');
            }
        });
    }
};
