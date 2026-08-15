<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_task_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('repair_order_registro_id');
            $table->date('task_date');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['repair_order_registro_id', 'task_date']);
            $table->index(['task_date', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_task_items');
    }
};
