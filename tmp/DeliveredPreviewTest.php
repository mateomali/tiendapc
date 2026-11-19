<?php

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

it('exports a delivered page preview from isolated test data', function (): void {
    $service = app(App\Services\RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Benjamín Laime', 'dni' => 50303882, 'modelo' => 'TCL 50 5G', 'marca' => 'TCL', 'descripcion' => 'Cambio de módulo', 'monto' => 50000, 'senia' => 15000]);
    $service->markReady($order);
    $service->deliver($order, now()->toDateString(), 'ticket', null, true);
    $next = $service->reenterAsNewWork($order, ['descripcion' => 'Revisión del conector de carga', 'monto' => 15000]);
    $service->deliver($next, now()->toDateString(), 'ticket', null, true);
    $other = $service->create(['nombre_cliente' => 'María Fernández', 'dni' => 30222111, 'modelo' => 'Samsung A52', 'marca' => 'Samsung', 'descripcion' => 'Cambio de batería', 'monto' => 35000]);
    $service->deliver($other, now()->subDay()->toDateString(), 'ticket', null, false);
    $response = $this->withSession(['repair_tech_authenticated' => true])->get(route('repairs.delivered'));
    $response->assertOk();
    file_put_contents(base_path('tmp/delivered-preview.html'), $response->getContent());
});
