<?php

use App\Http\Controllers\Repairs\WorkbenchController;
use App\Services\RepairService;

it('summarizes deposit and delivery payments while preserving the ready date after delivery', function (float $deposit): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Modulo', 'monto' => 40000, 'senia' => $deposit]);
    $this->travelTo(now()->setDate(2026, 11, 17));
    $service->markReady($order);
    $this->travelTo(now()->setDate(2026, 11, 19));
    $service->deliver($order, '2026-11-19', 'persona', null, true);
    $order->update(['estado' => 'ENTREGADA']);
    $ticket = app(WorkbenchController::class)->groupTickets(collect([$order]), true)[0];
    $history = $ticket['historyRepairs'][0];
    expect($history['fecha_listo_historial'])->toBe('2026-11-17')
        ->and($history['fecha_entregado'])->toBe('2026-11-19')
        ->and($history['historyPaymentSummary'])->toBe([
            'deposit' => $deposit, 'paidOnDelivery' => 40000.0 - $deposit, 'totalPaid' => 40000.0,
        ]);
})->with([0.0, 10000.0, 40000.0]);

it('does not invent a deposit or a ready date for legacy payments without a breakdown', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Modulo', 'monto' => 40000]);
    $order->update(['entregado' => 'si', 'estado' => 'ENTREGADA', 'senia' => 40000, 'fecha_entregado' => '2026-11-19']);
    $history = app(WorkbenchController::class)->serializeRepair($order, true);
    expect($history['fecha_listo_historial'])->toBeNull()
        ->and($history['historyPaymentSummary'])->toBe(['deposit' => null, 'paidOnDelivery' => null, 'totalPaid' => 40000.0]);
});

it('excludes repair price increments from payments in the history summary', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Modulo', 'monto' => 40000, 'senia' => 10000]);
    $service->addPayment($order, ['amount' => 5000, 'payment_type' => 'incremento', 'notes' => 'Trabajo adicional']);
    $service->deliver($order);
    $summary = app(WorkbenchController::class)->serializeRepair($order, true)['historyPaymentSummary'];
    expect($summary)->toBe(['deposit' => 10000.0, 'paidOnDelivery' => 35000.0, 'totalPaid' => 45000.0]);
});
