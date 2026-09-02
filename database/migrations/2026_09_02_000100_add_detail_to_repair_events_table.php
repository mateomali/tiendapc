<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orden_eventos', function (Blueprint $table): void {
            if (! Schema::hasColumn('orden_eventos', 'detalle')) {
                $table->text('detalle')->nullable()->after('evento');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orden_eventos', function (Blueprint $table): void {
            if (Schema::hasColumn('orden_eventos', 'detalle')) {
                $table->dropColumn('detalle');
            }
        });
    }
};
