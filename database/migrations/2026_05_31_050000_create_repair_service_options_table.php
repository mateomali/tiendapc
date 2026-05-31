<?php

use App\Services\RepairService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_service_options', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('type', 20);
            $table->string('value', 80);
            $table->string('label', 120);
            $table->text('description')->nullable();
            $table->string('repuesto', 120)->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['type', 'value']);
            $table->index(['type', 'active', 'usage_count']);
        });

        $now = now();
        $sortOrder = 1;

        foreach (RepairService::SERVICE_TEMPLATES as $value => $template) {
            DB::table('repair_service_options')->insert([
                'type' => 'service',
                'value' => $value,
                'label' => $template['label'],
                'description' => $template['description'],
                'repuesto' => $template['repuesto'],
                'usage_count' => 0,
                'sort_order' => $sortOrder++,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        foreach (RepairService::FAILURE_TEMPLATES as $label => $description) {
            DB::table('repair_service_options')->insert([
                'type' => 'failure',
                'value' => Str::slug($label, '_'),
                'label' => $label,
                'description' => $description,
                'repuesto' => null,
                'usage_count' => 0,
                'sort_order' => $sortOrder++,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_service_options');
    }
};
