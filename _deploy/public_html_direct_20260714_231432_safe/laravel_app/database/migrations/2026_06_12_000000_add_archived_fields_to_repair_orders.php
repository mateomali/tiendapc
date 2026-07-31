<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->timestamp('archivado_at')->nullable()->after('fecha_entregado');
            $table->string('archivado_motivo', 40)->nullable()->after('archivado_at');
            $table->index('archivado_at');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropIndex(['archivado_at']);
            $table->dropColumn(['archivado_at', 'archivado_motivo']);
        });
    }
};
