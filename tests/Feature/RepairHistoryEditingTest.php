<?php

use App\Models\RepairEvent;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Services\RepairService;

it('deletes only the selected history movement and rejects movements from another work', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 15000, 'senia' => 5000]);
    $other = $service->addRepair($order, ['modelo' => $order->modelo, 'descripcion' => 'Bateria', 'monto' => 10000]);
    $event = RepairEvent::where('orden_id', $order->id)->where('reparacion', $order->reparacion)->firstOrFail();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.history.delete', [$other, $event]))->assertNotFound();
    $payments = RepairPayment::where('orden_id', $order->id)->get()->toArray();
    $this->post(route('repairs.orders.history.delete', [$order, $event]))->assertRedirect()->assertSessionHas('success');
    expect(RepairEvent::find($event->id))->toBeNull()
        ->and($order->fresh())->not->toBeNull()
        ->and($other->fresh())->not->toBeNull()
        ->and(RepairPayment::where('orden_id', $order->id)->get()->toArray())->toBe($payments);
});

it('deletes a whole history group with its payments and events preserving sibling work', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 15000, 'senia' => 5000]);
    $other = $service->addRepair($order, ['modelo' => $order->modelo, 'descripcion' => 'Bateria', 'monto' => 10000, 'senia' => 2000]);
    $service->deliver($order);
    $otherPayments = RepairPayment::where('orden_id', $other->id)->where('reparacion', $other->reparacion)->get()->toArray();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.delete', $order))->assertRedirect();
    expect(RepairOrder::whereKey($order->getKey())->exists())->toBeFalse()
        ->and(RepairEvent::where('orden_id', $order->id)->where('reparacion', $order->reparacion)->count())->toBe(0)
        ->and(RepairPayment::where('orden_id', $order->id)->where('reparacion', $order->reparacion)->count())->toBe(0)
        ->and($other->fresh())->not->toBeNull()
        ->and(RepairPayment::where('orden_id', $other->id)->where('reparacion', $other->reparacion)->get()->toArray())->toBe($otherPayments);
});

it('paginates delivered orders before serialization without splitting their work', function (): void {
    $service = app(RepairService::class);
    $first = $service->create(['nombre_cliente' => 'Primero', 'descripcion' => 'Pantalla', 'monto' => 15000]);
    $sibling = $service->addRepair($first, ['descripcion' => 'Bateria', 'monto' => 10000]);
    $second = $service->create(['nombre_cliente' => 'Segundo', 'descripcion' => 'Carga', 'monto' => 5000]);
    $service->deliver($first, '2026-11-17');
    $service->deliver($sibling, '2026-11-18');
    $service->deliver($second, '2026-11-16');
    $result = $service->deliveredPage(['page' => 1], 1);
    expect($result['pagination'])->toBe(['page' => 1, 'perPage' => 1, 'total' => 2, 'totalPages' => 2])
        ->and($result['orders']->pluck('id')->unique()->all())->toBe([$first->id])
        ->and($result['orders']->count())->toBe(2);
    $result = $service->deliveredPage(['page' => 999], 1);
    expect($result['pagination']['page'])->toBe(2)
        ->and($result['orders']->first()->id)->toBe($second->id);
    $result = $service->deliveredPage(['orden' => 'asc'], 1);
    expect($result['orders']->first()->id)->toBe($second->id);
    $result = $service->deliveredPage(['q' => 'Segundo'], 1);
    expect($result['pagination']['total'])->toBe(1)
        ->and($result['orders']->first()->id)->toBe($second->id);
});
