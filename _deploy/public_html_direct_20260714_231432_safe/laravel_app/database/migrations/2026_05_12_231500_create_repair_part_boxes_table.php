<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_part_boxes', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('code', 16)->unique();
            $table->unsignedInteger('sort_order')->default(1);
            $table->timestamps();
        });

        $now = now();
        $boxes = DB::table('repair_parts')
            ->select('box')
            ->whereNotNull('box')
            ->where('box', '<>', '')
            ->distinct()
            ->pluck('box')
            ->map(fn (string $box): string => strtolower(trim($box)))
            ->filter()
            ->unique()
            ->sortBy(fn (string $box): int => $this->boxSortOrder($box))
            ->values()
            ->map(fn (string $box): array => [
                'code' => $box,
                'sort_order' => $this->boxSortOrder($box),
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        if ($boxes !== []) {
            DB::table('repair_part_boxes')->insert($boxes);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_part_boxes');
    }

    private function boxSortOrder(string $box): int
    {
        $code = strtolower(trim($box));
        $value = 0;

        foreach (str_split($code) as $char) {
            if ($char < 'a' || $char > 'z') {
                continue;
            }

            $value = ($value * 26) + (ord($char) - 96);
        }

        return $value > 0 ? $value : 999999;
    }
};
