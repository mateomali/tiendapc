<?php

use App\Http\Controllers\Repairs\WorkbenchController;
use App\Models\RepairPayment;
use App\Services\RepairService;

it('treats warranty work as paid without creating payments through editing and redelivery', function (float $deposit): void {
    $service = app(RepairService::class);
    $order = $service->create([
        'nombre_cliente' => 'Cliente garantia', 'modelo' => 'TCL 50',
        'descripcion' => 'Pantalla', 'monto' => 50000, 'senia' => $deposit,
    ]);
    $service->deliver($order, '2026-10-10');
    $payments = RepairPayment::where('orden_id', $order->id)->get()->toArray();
    $service->reopenWarranty($order, 'Volvio sin imagen');
    $controller = app(WorkbenchController::class);
    $view = $controller->serializeRepair($order, false);
    expect($view['isFullyPaid'])->toBeTrue()
        ->and((float) $view['senia'])->toBe(50000.0)
        ->and((float) $order->senia)->toBe(50000.0);

    $service->update($order, [
        'nombre_cliente' => 'Cliente garantia', 'modelo' => 'TCL 50',
        'descripcion' => 'Pantalla revisada', 'monto' => 50000, 'senia' => $view['senia'],
    ]);
    $service->markReady($order);
    expect($controller->serializeRepair($order, false)['isFullyPaid'])->toBeTrue();
    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['filter_saldo' => 'pagado', 'q' => $order->id]))
        ->assertOk()->assertInertia(fn ($page) => $page->has('tickets', 1));
    $service->deliver($order);
    expect($controller->serializeRepair($order, true)['isFullyPaid'])->toBeTrue()
        ->and((float) $order->senia)->toBe(50000.0)
        ->and(RepairPayment::where('orden_id', $order->id)->get()->toArray())->toBe($payments);

    $new = $service->reenterAsNewWork($order, ['descripcion' => 'Nueva falla']);
    expect($new->isWarrantyPaid())->toBeFalse()
        ->and($new->settledAmount())->toBe(0.0)
        ->and($controller->serializeRepair($new, false)['isFullyPaid'])->toBeFalse();
})->with([0.0, 10000.0, 50000.0]);
