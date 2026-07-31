<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_parts', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('quantity')->default(0);
            $table->string('model', 255);
            $table->string('box', 16);
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();
            $table->index(['box', 'sort_order']);
            $table->index('model');
        });

        $this->seedInitialParts();
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_parts');
    }

    private function seedInitialParts(): void
    {
        if (DB::table('repair_parts')->exists()) {
            return;
        }

        $path = database_path('seeders/data/repuestos.csv');
        if (! is_file($path)) {
            return;
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            return;
        }

        fgetcsv($handle);

        $rows = [];
        $sortOrder = 1;
        $now = now();

        while (($line = fgetcsv($handle)) !== false) {
            $quantity = trim((string) ($line[0] ?? ''));
            $model = trim((string) ($line[1] ?? ''));
            $box = strtolower(trim((string) ($line[2] ?? '')));

            if ($model === '' || $box === '') {
                continue;
            }

            $rows[] = [
                'quantity' => $quantity === '' ? 1 : max(0, (int) $quantity),
                'model' => $model,
                'box' => $box,
                'sort_order' => $sortOrder++,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        fclose($handle);

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('repair_parts')->insert($chunk);
        }
    }
};
