<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('repair_parts', function (Blueprint $table): void {
            $table->unsignedInteger('reserved_order_id')->nullable()->after('sort_order');
            $table->unsignedSmallInteger('reserved_repair_number')->nullable()->after('reserved_order_id');
            $table->timestamp('reserved_at')->nullable()->after('reserved_repair_number');
            $table->index(['reserved_order_id', 'reserved_repair_number']);
        });
    }

    public function down(): void
    {
        Schema::table('repair_parts', function (Blueprint $table): void {
            $table->dropIndex(['reserved_order_id', 'reserved_repair_number']);
            $table->dropColumn(['reserved_order_id', 'reserved_repair_number', 'reserved_at']);
        });
    }
};
