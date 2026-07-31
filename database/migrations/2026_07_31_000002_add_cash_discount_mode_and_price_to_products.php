<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('cash_discount_mode', 20)->nullable()->after('cash_discount_percentage');
            $table->integer('cash_price')->nullable()->after('cash_discount_mode');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn(['cash_discount_mode', 'cash_price']);
        });
    }
};
