<?php

use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Services\RepairService;
use Inertia\Testing\AssertableInertia as Assert;

it('persists per-work discounts and exposes them on the ticket', function (): void {
    $service = app(RepairService::class);
    $order = $service->create([
        'nombre_cliente' => 'Cliente prueba',
        'jobs' => [
            ['descripcion' => 'Trabajo uno', 'monto' => 50000, 'cash_discount_enabled' => false],
            ['descripcion' => 'Trabajo dos', 'monto' => 50000],
        ],
    ]);
    $rows = RepairOrder::where('id', $order->id)->orderBy('reparacion')->get();
    expect($rows[0]->cash_discount_enabled)->toBeFalse()
        ->and($rows[1]->cash_discount_enabled)->toBeTrue();
    $service->update($rows[0], ['nombre_cliente' => 'Cliente prueba', 'monto' => 50000, 'cash_discount_enabled' => true]);
    expect($rows[0]->refresh()->cash_discount_enabled)->toBeTrue();
    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $order->id]))
        ->assertOk()->assertInertia(fn (Assert $page) => $page->where('ticket.repairs.0.cash_discount_enabled', true));
    $service->update($rows[0], ['nombre_cliente' => 'Cliente prueba', 'monto' => 50000, 'cash_discount_enabled' => false]);
    expect($rows[0]->refresh()->cash_discount_enabled)->toBeFalse();
    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $order->id]))
        ->assertOk()->assertInertia(fn (Assert $page) => $page->where('ticket.repairs.0.cash_discount_enabled', false));
});

it('edits and deletes an individual deposit while preserving other deposits', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente prueba', 'descripcion' => 'Reparacion', 'monto' => 50000, 'senia' => 10000]);
    $service->addPayment($order, ['amount' => 5000, 'method' => 'efectivo']);
    $payment = RepairPayment::where('orden_id', $order->id)->firstOrFail();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.update', [$order, $payment]), ['amount' => 12000, 'method' => 'transferencia', 'paid_at' => '2026-09-29'])
        ->assertSessionHasNoErrors()->assertRedirect();
    expect((float) $order->refresh()->senia)->toBe(17000.0)
        ->and($payment->refresh()->method)->toBe('transferencia');
    $this->post(route('repairs.orders.payments.delete', [$order, $payment]))->assertRedirect();
    expect((float) $order->refresh()->senia)->toBe(5000.0);
});

it('rejects deposit edits from another work', function (): void {
    $service = app(RepairService::class);
    $first = $service->create(['nombre_cliente' => 'Uno', 'descripcion' => 'Reparacion', 'monto' => 50000, 'senia' => 10000]);
    $second = $service->create(['nombre_cliente' => 'Dos', 'descripcion' => 'Reparacion', 'monto' => 50000]);
    $payment = RepairPayment::where('orden_id', $first->id)->firstOrFail();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.update', [$second, $payment]), ['amount' => 1, 'method' => 'efectivo', 'paid_at' => '2026-09-29'])->assertNotFound();
    expect((float) $payment->refresh()->amount)->toBe(10000.0);
});

it('delivers only the selected scope and prints only delivered work', function (bool $all): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Entrega prueba', 'jobs' => [
        ['descripcion' => 'Uno', 'monto' => 40000],
        ['descripcion' => 'Dos', 'monto' => 50000],
    ]]);
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), ['entregar_todos' => $all, 'entrega_via' => 'dni', 'abono_efectivo' => true])
        ->assertRedirect()->assertSessionHasNoErrors();
    expect(RepairOrder::where('id', $order->id)->where('entregado', 'si')->count())->toBe($all ? 2 : 1);
    $this->get(route('repairs.tickets.delivery', ['orderId' => $order->id]))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('ticket.repairs', $all ? 2 : 1));
})->with([false, true]);
