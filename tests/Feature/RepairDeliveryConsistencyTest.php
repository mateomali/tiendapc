<?php

use App\Models\RepairOrder;
use App\Models\RepairTaskItem;
use App\Services\RepairService;

it('moves each work from consultations to delivered regardless of its previous state and optional fields', function (string $state): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente entrega', 'descripcion' => 'Trabajo', 'monto' => 0]);
    $other = $service->addRepair($order, ['descripcion' => 'Otro trabajo', 'monto' => 1000]);
    $order->update(['estado' => $state, 'descripcion' => '', 'modelo' => null, 'contacto' => null, 'fecha_estimada' => null]);
    RepairTaskItem::create(['repair_order_registro_id' => $order->registro_id, 'task_date' => now()->toDateString()]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), ['entrega_via' => 'ticket'])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh()->entregado)->toBe('si')
        ->and($other->refresh()->entregado)->toBe('no')
        ->and($service->activeOrders(['q' => (string) $order->id])->pluck('registro_id')->all())->not->toContain($order->registro_id)
        ->and($service->deliveredOrders(['q' => (string) $order->id])->pluck('registro_id')->all())->toContain($order->registro_id)
        ->and(RepairTaskItem::where('repair_order_registro_id', $order->registro_id)->count())->toBe(0);
})->with(['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'GARANTIA', 'LISTA', 'CANCELADA', 'ENTREGADA', 'Estado antiguo']);

it('delivers and reloads the selected sibling with the legacy composite identity', function (): void {
    $service = app(RepairService::class);
    $first = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 0]);
    $second = $service->addRepair($first, ['descripcion' => 'Bateria', 'monto' => 0]);
    $identity = new ReflectionProperty(RepairOrder::class, 'legacyPrimaryKey');
    $original = $identity->getValue();

    try {
        $identity->setValue(null, true);
        $second->setKeyName('id');
        $delivered = $service->deliver($second);
        expect($delivered->reparacion)->toBe($second->reparacion)
            ->and($delivered->entregado)->toBe('si')
            ->and($second->fresh()->reparacion)->toBe($second->reparacion)
            ->and(RepairOrder::where('id', $first->id)->where('reparacion', $first->reparacion)->value('entregado'))->toBe('no');
    } finally {
        $identity->setValue(null, $original);
    }
});
