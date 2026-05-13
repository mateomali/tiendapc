<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->unsignedInteger('inventory_part_id')->nullable()->after('repuesto_pedido_oculto_at');
            $table->string('inventory_part_model', 255)->nullable()->after('inventory_part_id');
            $table->string('inventory_part_box', 16)->nullable()->after('inventory_part_model');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropColumn(['inventory_part_id', 'inventory_part_model', 'inventory_part_box']);
        });
    }
};
