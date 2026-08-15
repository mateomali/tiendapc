<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('repair_annotations')) {
            return;
        }

        Schema::create('repair_annotations', function (Blueprint $table): void {
            $table->id();
            $table->text('body');
            $table->string('source', 40)->default('manual');
            $table->unsignedInteger('repair_order_id')->nullable();
            $table->unsignedBigInteger('repair_order_registro_id')->nullable();
            $table->string('customer_name', 160)->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index('occurred_at');
            $table->index('repair_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_annotations');
    }
};
