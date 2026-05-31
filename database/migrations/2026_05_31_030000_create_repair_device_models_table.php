<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_device_models', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('category_id')->default(4);
            $table->string('brand', 80)->nullable();
            $table->string('model', 255);
            $table->string('normalized_model', 255);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();
            $table->unique(['category_id', 'normalized_model']);
            $table->index(['brand', 'model']);
            $table->index('usage_count');
        });

        if (! Schema::hasTable('ordenes')) {
            return;
        }

        $now = now();

        DB::table('ordenes')
            ->select('modelo', 'categorias_reparacion', DB::raw('COUNT(*) as usage_count'))
            ->whereNotNull('modelo')
            ->where('modelo', '<>', '')
            ->groupBy('modelo', 'categorias_reparacion')
            ->orderByDesc('usage_count')
            ->get()
            ->each(function (object $row) use ($now): void {
                $normalized = $this->normalizeModel((string) $row->modelo);
                $model = $normalized;

                if ($normalized === '') {
                    return;
                }

                $categoryId = max(1, (int) ($row->categorias_reparacion ?? 4));
                $existing = DB::table('repair_device_models')
                    ->where('category_id', $categoryId)
                    ->where('normalized_model', $normalized)
                    ->first();

                if ($existing !== null) {
                    DB::table('repair_device_models')
                        ->where('id', $existing->id)
                        ->update([
                            'usage_count' => (int) $existing->usage_count + (int) $row->usage_count,
                            'updated_at' => $now,
                        ]);

                    return;
                }

                DB::table('repair_device_models')->insert([
                    'category_id' => $categoryId,
                    'brand' => $this->detectBrand($model),
                    'model' => $model,
                    'normalized_model' => $normalized,
                    'usage_count' => (int) $row->usage_count,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_device_models');
    }

    private function normalizeModel(string $model): string
    {
        $value = Str::ascii(Str::upper($model));
        $value = preg_replace('/[^A-Z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function detectBrand(string $model): ?string
    {
        $normalized = $this->normalizeModel($model);

        foreach (['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'TCL', 'LG'] as $brand) {
            if ($normalized === $brand || str_starts_with($normalized, $brand . ' ')) {
                return $brand;
            }
        }

        return null;
    }
};
