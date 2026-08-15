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
                    $model = $this->stripBrand($this->canonicalModel((string) $row->modelo));

                    if ($model !== '') {
                        DB::table('ordenes')
                            ->where('registro_id', $row->registro_id)
                            ->update(['modelo' => $model]);
                    }
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
            $canonical = $this->canonicalModel((string) $row->model);
            $detectedBrand = $this->detectBrand($canonical);
            $brand = $this->canonicalModel((string) ($row->brand ?? '')) ?: $detectedBrand;
            $model = $this->stripBrand($canonical, $brand);

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
                        'brand' => $existing->brand ?: $brand,
                        'usage_count' => (int) $existing->usage_count + (int) $row->usage_count,
                        'updated_at' => $now,
                    ]);

                continue;
            }

            DB::table('repair_device_models')->insert([
                'category_id' => $categoryId,
                'brand' => $brand ?: null,
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
        foreach ($this->knownBrands() as $brand) {
            if ($model === $brand || str_starts_with($model, $brand . ' ')) {
                return $brand;
            }
        }

        return null;
    }

    private function stripBrand(string $model, ?string $preferredBrand = null): string
    {
        $brands = $preferredBrand !== null && $preferredBrand !== '' && $preferredBrand !== 'OTRAS'
            ? array_values(array_unique([$preferredBrand, ...$this->knownBrands()]))
            : $this->knownBrands();

        foreach ($brands as $brand) {
            if ($model === $brand) {
                return '';
            }

            if (str_starts_with($model, $brand . ' ')) {
                return trim(substr($model, strlen($brand) + 1));
            }
        }

        return $model;
    }

    /**
     * @return array<int, string>
     */
    private function knownBrands(): array
    {
        return ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'];
    }
};
