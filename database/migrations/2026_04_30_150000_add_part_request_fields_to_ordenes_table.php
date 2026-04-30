<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->boolean('repuesto_pedido')->default(false)->after('repuesto');
            $table->timestamp('repuesto_pedido_at')->nullable()->after('repuesto_pedido');
            $table->timestamp('repuesto_pedido_oculto_at')->nullable()->after('repuesto_pedido_at');
        });

        DB::table('ordenes')
            ->whereNotNull('repuesto')
            ->where('repuesto', '<>', '')
            ->update([
                'repuesto_pedido' => true,
                'repuesto_pedido_at' => DB::raw('COALESCE(updated_at, created_at, NOW())'),
            ]);
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropColumn(['repuesto_pedido', 'repuesto_pedido_at', 'repuesto_pedido_oculto_at']);
        });
    }
};
