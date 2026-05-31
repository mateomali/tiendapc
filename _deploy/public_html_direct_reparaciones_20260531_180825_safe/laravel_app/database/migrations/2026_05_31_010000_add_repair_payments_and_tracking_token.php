<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes', function (Blueprint $table): void {
            $table->string('tracking_token', 5)->nullable()->after('dni')->index();
        });

        Schema::create('repair_payments', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('orden_id');
            $table->unsignedInteger('reparacion')->default(1);
            $table->decimal('amount', 10, 2);
            $table->string('payment_type', 40)->default('senia');
            $table->string('method', 40)->nullable();
            $table->text('notes')->nullable();
            $table->date('paid_at');
            $table->timestamps();
            $table->index(['orden_id', 'reparacion', 'paid_at']);
        });

        $now = now();

        DB::table('ordenes')
            ->where('senia', '>', 0)
            ->orderBy('registro_id')
            ->chunkById(100, function ($orders) use ($now): void {
                $rows = [];

                foreach ($orders as $order) {
                    $rows[] = [
                        'orden_id' => $order->id,
                        'reparacion' => $order->reparacion,
                        'amount' => $order->senia,
                        'payment_type' => 'senia',
                        'method' => null,
                        'notes' => 'Migrado desde campo sena',
                        'paid_at' => $order->fecha ?: $now->toDateString(),
                        'created_at' => $order->created_at ?: $now,
                        'updated_at' => $order->updated_at ?: $now,
                    ];
                }

                if ($rows !== []) {
                    DB::table('repair_payments')->insert($rows);
                }
            }, 'registro_id');

        DB::table('ordenes')
            ->where('dni', (int) config('tienda.repair_default_dni', 12345678))
            ->select('id')
            ->distinct()
            ->orderBy('id')
            ->chunk(100, function ($orders): void {
                foreach ($orders as $order) {
                    DB::table('ordenes')
                        ->where('id', $order->id)
                        ->update(['tracking_token' => str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT)]);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_payments');

        Schema::table('ordenes', function (Blueprint $table): void {
            $table->dropIndex(['tracking_token']);
            $table->dropColumn('tracking_token');
        });
    }
};
