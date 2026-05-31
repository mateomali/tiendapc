<?php

use Illuminate\Database\Migrations\Migration;
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

        $keyColumn = Schema::hasColumn('ordenes', 'registro_id') ? 'registro_id' : 'id';

        DB::table('ordenes')
            ->whereNotNull('descripcion')
            ->where('descripcion', '<>', '')
            ->orderBy($keyColumn)
            ->get([$keyColumn, 'reparacion', 'descripcion'])
            ->each(function (object $row) use ($keyColumn): void {
                $query = DB::table('ordenes')->where($keyColumn, $row->{$keyColumn});
                if ($keyColumn !== 'registro_id') {
                    $query->where('reparacion', $row->reparacion);
                }

                $query->update([
                    'descripcion' => $this->uppercaseFailure((string) $row->descripcion),
                ]);
            });
    }

    public function down(): void
    {
        //
    }

    private function uppercaseFailure(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', Str::upper($value)) ?? '');
    }
};
