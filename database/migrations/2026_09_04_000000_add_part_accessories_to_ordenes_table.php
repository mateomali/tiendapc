<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->json('repuesto_agregados')->nullable()->after('repuesto_pedido_oculto_at');
            $table->string('repuesto_agregado_otro', 255)->nullable()->after('repuesto_agregados');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropColumn(['repuesto_agregados', 'repuesto_agregado_otro']);
        });
    }
};
