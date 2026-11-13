<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('repair_service_options')->where('type', 'failure')
            ->whereIn('value', ['modulo', 'bateria'])->update(['active' => false]);
        DB::table('repair_service_options')->where('type', 'failure')
            ->where('value', 'pin_de_carga')->update([
                'label' => 'Placa de carga',
                'description' => 'Falla en placa de carga.',
            ]);
    }

    public function down(): void
    {
        DB::table('repair_service_options')->where('type', 'failure')
            ->whereIn('value', ['modulo', 'bateria'])->update(['active' => true]);
        DB::table('repair_service_options')->where('type', 'failure')
            ->where('value', 'pin_de_carga')->update([
                'label' => 'Pin de carga',
                'description' => 'Falla en pin de carga.',
            ]);
    }
};
