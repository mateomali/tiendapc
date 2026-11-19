<?php

use App\Models\RepairEvent;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Services\RepairService;
use Inertia\Testing\AssertableInertia as Assert;

it('reenters a delivered phone as a new unpaid work preserving the previous work', function (): void {
    $service = app(RepairService::class);
    $previous = $service->create([
        'nombre_cliente' => 'Cliente reingreso', 'modelo' => 'TCL 50 5G', 'marca' => 'TCL',
        'descripcion' => 'Cambio de modulo', 'monto' => 50000, 'senia' => 10000,
        'categorias_reparacion' => 1,
    ]);
    $service->markReady($previous);
    $service->deliver($previous, '2026-10-15', 'ticket');
    $snapshot = $previous->fresh()->getAttributes();
    $previousPayments = RepairPayment::where('orden_id', $previous->id)->get()->toArray();

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.reenter', $previous), [
            'descripcion' => 'No carga bateria', 'senia' => 99999,
        ])->assertSessionHasNoErrors()->assertRedirect(route('repairs.workbench', ['q' => $previous->id]));

    $new = RepairOrder::where('id', $previous->id)->orderByDesc('reparacion')->firstOrFail();
    expect($new->reparacion)->toBe($previous->reparacion + 1)
        ->and($new->modelo)->toBe($previous->modelo)
        ->and($new->marca)->toBe($previous->marca)
        ->and((float) $new->monto)->toBe(50000.0)
        ->and((float) $new->senia)->toBe(0.0)
        ->and($new->estado)->toBe('PENDIENTE')
        ->and($new->entregado)->toBe('no')
        ->and($new->fecha->format('Y-m-d'))->toBe(now()->toDateString())
        ->and($new->fecha_entregado)->toBeNull()
        ->and($new->garantia_motivo)->toBeNull()
        ->and($previous->fresh()->getAttributes())->toBe($snapshot)
        ->and(RepairPayment::where('orden_id', $previous->id)->get()->toArray())->toBe($previousPayments);
    expect(RepairEvent::where('orden_id', $new->id)->where('reparacion', $new->reparacion)
        ->where('evento', 'NUEVO_TRABAJO_REINGRESO')->exists())->toBeTrue();

    $this->get(route('repairs.workbench', ['q' => $previous->id]))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('tickets.0.historyRepairs', 2)
            ->where('tickets.0.historyRepairs.0.entregado', 'si')
            ->where('tickets.0.historyRepairs.0.fecha_entregado', '2026-10-15')
            ->where('tickets.0.historyRepairs.1.entregado', 'no'));
});

it('allows changing the new work price and rejects reentry of active work', function (): void {
    $service = app(RepairService::class);
    $previous = $service->create(['nombre_cliente' => 'Cliente', 'modelo' => 'TCL', 'descripcion' => 'Pantalla', 'monto' => 50000]);
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.reenter', $previous), ['descripcion' => 'Bateria'])->assertStatus(422);
    $service->deliver($previous);
    $this->post(route('repairs.orders.reenter', $previous), ['descripcion' => 'Bateria', 'monto' => -1])->assertSessionHasErrors('monto');
    $this->post(route('repairs.orders.reenter', $previous), ['descripcion' => '', 'monto' => 25000])->assertSessionHasErrors('descripcion');
    $this->post(route('repairs.orders.reenter', $previous), ['descripcion' => 'Bateria', 'monto' => 25000])->assertSessionHasNoErrors();
    expect((float) RepairOrder::where('id', $previous->id)->orderByDesc('reparacion')->firstOrFail()->monto)->toBe(25000.0);
});
