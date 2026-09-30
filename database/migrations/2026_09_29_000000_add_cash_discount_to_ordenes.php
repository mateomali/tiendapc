<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ordenes', 'cash_discount_enabled')) {
            Schema::table('ordenes', fn (Blueprint $table) => $table->boolean('cash_discount_enabled')->default(true));
        }
    }

    public function down(): void
    {
        Schema::table('ordenes', fn (Blueprint $table) => $table->dropColumn('cash_discount_enabled'));
    }
};
