<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ordenes')) {
            DB::table('ordenes')
                ->whereNotNull('modelo')
                ->where('modelo', '<>', '')
                ->orderBy('registro_id')
                ->get(['registro_id', 'modelo'])
                ->each(function (object $row): void {
                    DB::table('ordenes')
                        ->where('registro_id', $row->registro_id)
                        ->update(['modelo' => $this->canonicalModel((string) $row->modelo)]);
                });
        }

        if (! Schema::hasTable('repair_device_models')) {
            return;
        }

        $rows = DB::table('repair_device_models')
            ->orderByDesc('usage_count')
            ->orderBy('id')
            ->get();

        DB::table('repair_device_models')->delete();

        $now = now();

        foreach ($rows as $row) {
            $model = $this->canonicalModel((string) $row->model);

            if ($model === '') {
                continue;
            }

            $categoryId = max(1, (int) $row->category_id);
            $existing = DB::table('repair_device_models')
                ->where('category_id', $categoryId)
                ->where('normalized_model', $model)
                ->first();

            if ($existing !== null) {
                DB::table('repair_device_models')
                    ->where('id', $existing->id)
                    ->update([
                        'usage_count' => (int) $existing->usage_count + (int) $row->usage_count,
                        'updated_at' => $now,
                    ]);

                continue;
            }

            DB::table('repair_device_models')->insert([
                'category_id' => $categoryId,
                'brand' => $this->detectBrand($model),
                'model' => $model,
                'normalized_model' => $model,
                'usage_count' => (int) $row->usage_count,
                'created_at' => $row->created_at ?? $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        //
    }

    private function canonicalModel(string $model): string
    {
        $value = Str::ascii(Str::upper($model));
        $value = preg_replace('/[^A-Z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function detectBrand(string $model): ?string
    {
        foreach (['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'] as $brand) {
            if ($model === $brand || str_starts_with($model, $brand . ' ')) {
                return $brand;
            }
        }

        return null;
    }
};
