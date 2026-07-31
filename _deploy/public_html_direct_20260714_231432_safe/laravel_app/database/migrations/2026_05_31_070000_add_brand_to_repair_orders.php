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
        if (! Schema::hasTable('ordenes')) {
            return;
        }

        if (! Schema::hasColumn('ordenes', 'marca')) {
            Schema::table('ordenes', function (Blueprint $table): void {
                $table->string('marca', 80)->nullable()->after('contacto');
            });
        }

        $keyColumn = Schema::hasColumn('ordenes', 'registro_id') ? 'registro_id' : 'id';

        DB::table('ordenes')
            ->where(function ($query): void {
                $query->whereNotNull('modelo')->orWhereNotNull('descripcion');
            })
            ->orderBy($keyColumn)
            ->get([$keyColumn, 'reparacion', 'marca', 'modelo', 'descripcion'])
            ->each(function (object $row) use ($keyColumn): void {
                $model = $this->canonicalModel((string) ($row->modelo ?? ''));
                $description = trim((string) ($row->descripcion ?? ''));
                $brand = $this->canonicalModel((string) ($row->marca ?? ''))
                    ?: $this->detectBrand($model)
                    ?: $this->detectTrailingBrand($description);
                $cleanModel = $this->stripBrand($model, $brand);

                $query = DB::table('ordenes')->where($keyColumn, $row->{$keyColumn});
                if ($keyColumn !== 'registro_id') {
                    $query->where('reparacion', $row->reparacion);
                }

                $query->update([
                    'marca' => $brand !== '' ? $brand : null,
                    'modelo' => $cleanModel !== '' ? $cleanModel : null,
                    'descripcion' => $this->stripTrailingDeviceText($description, $cleanModel, $brand) ?: $description,
                ]);
            });
    }

    public function down(): void
    {
        if (Schema::hasTable('ordenes') && Schema::hasColumn('ordenes', 'marca')) {
            Schema::table('ordenes', function (Blueprint $table): void {
                $table->dropColumn('marca');
            });
        }
    }

    private function canonicalModel(string $model): string
    {
        $value = Str::ascii(Str::upper($model));
        $value = preg_replace('/[^A-Z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function detectBrand(string $model): string
    {
        foreach ($this->knownBrands() as $brand) {
            if ($model === $brand || str_starts_with($model, $brand . ' ')) {
                return $brand;
            }
        }

        return '';
    }

    private function detectTrailingBrand(string $description): string
    {
        $normalized = $this->canonicalModel($description);

        foreach ($this->knownBrands() as $brand) {
            if ($normalized === $brand || str_ends_with($normalized, ' ' . $brand)) {
                return $brand;
            }
        }

        return '';
    }

    private function stripBrand(string $model, string $brand): string
    {
        $brands = $brand !== '' && $brand !== 'OTRAS'
            ? array_values(array_unique([$brand, ...$this->knownBrands()]))
            : $this->knownBrands();

        foreach ($brands as $knownBrand) {
            if ($model === $knownBrand) {
                return '';
            }

            if (str_starts_with($model, $knownBrand . ' ')) {
                return trim(substr($model, strlen($knownBrand) + 1));
            }
        }

        return $model;
    }

    private function stripTrailingDeviceText(string $description, string $model, string $brand): string
    {
        $clean = trim($description);
        $tokens = array_values(array_filter([trim($brand . ' ' . $model), $model, $brand]));

        foreach ($tokens as $token) {
            $normalizedToken = $this->canonicalModel($token);
            $normalizedDescription = $this->canonicalModel($clean);

            if ($normalizedToken !== '' && ($normalizedDescription === $normalizedToken || str_ends_with($normalizedDescription, ' ' . $normalizedToken))) {
                $clean = trim(substr($clean, 0, max(0, strlen($clean) - strlen($token))));
            }
        }

        return trim($clean);
    }

    /**
     * @return array<int, string>
     */
    private function knownBrands(): array
    {
        return ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'];
    }
};
