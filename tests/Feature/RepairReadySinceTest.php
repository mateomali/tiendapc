<?php

use App\Http\Controllers\Repairs\WorkbenchController;
use App\Models\RepairOrder;
use App\Services\RepairService;

it('keeps the ready date through edits and resets it on a new repair cycle', function (bool $direct): void {
    $this->travelTo(now()->startOfDay());
    $order = RepairOrder::query()->create([
        'id' => 8101,
        'reparacion' => 1,
        'nombre_cliente' => 'Cliente',
        'modelo' => 'G22',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);
    $service = app(RepairService::class);
    $controller = app(WorkbenchController::class);
    $firstDate = now()->toDateString();
    $direct ? $service->updateState($order, 'LISTA') : $service->markReady($order);
    expect($controller->serializeRepair($order->refresh(), false)['listo_desde'])->toBe($firstDate);

    $this->travel(2)->days();
    $order->update(['observaciones' => 'Comentario posterior']);
    $service->recordEvent($order, 'ACTUALIZADA', 'LISTA', 'LISTA');
    $service->updateState($order, 'LISTA');
    expect($controller->serializeRepair($order->refresh(), false)['listo_desde'])->toBe($firstDate);

    $service->updateState($order, 'GARANTIA');
    expect($controller->serializeRepair($order->refresh(), false)['listo_desde'])->toBeNull();
    $this->travel(1)->days();
    $service->updateState($order, 'LISTA');
    expect($controller->serializeRepair($order->refresh(), false)['listo_desde'])->toBe(now()->toDateString());
})->with([true, false]);

it('does not invent a ready date when historical events are missing', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 8102,
        'reparacion' => 1,
        'nombre_cliente' => 'Cliente',
        'estado' => 'LISTA',
        'entregado' => 'no',
    ]);
    expect(app(WorkbenchController::class)->serializeRepair($order, false)['listo_desde'])->toBeNull();
});
