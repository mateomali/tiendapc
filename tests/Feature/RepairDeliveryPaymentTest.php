<?php

use App\Models\RepairPayment;
use App\Services\RepairService;

it('records the outstanding balance on delivery with its date and method only once', function (bool $cash, float $expected): void {
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_enabled', '1');
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_threshold', '30000');
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_percentage', '10');
    $service = app(RepairService::class);
    $order = $service->create([
        'nombre_cliente' => 'Cliente entrega', 'modelo' => 'TCL',
        'descripcion' => 'Pantalla', 'monto' => 50000, 'senia' => 10000,
    ]);
    $initial = RepairPayment::where('orden_id', $order->id)->firstOrFail()->getAttributes();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), [
            'fecha_entregado' => '2026-11-17', 'abono_efectivo' => $cash, 'entrega_via' => 'ticket',
        ])->assertRedirect()->assertSessionHasNoErrors();
    $payment = RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->firstOrFail();
    expect((float) $payment->amount)->toBe($expected)
        ->and($payment->method)->toBe($cash ? 'efectivo' : 'transferencia')
        ->and($payment->paid_at->format('Y-m-d'))->toBe('2026-11-17')
        ->and((float) $order->refresh()->senia)->toBe(10000 + $expected)
        ->and(RepairPayment::findOrFail($initial['id'])->getAttributes())->toBe($initial);
    $service->deliver($order, '2026-11-17', 'ticket', null, $cash);
    expect(RepairPayment::where('orden_id', $order->id)->count())->toBe(2);
    $service->reopenWarranty($order, 'Falla del mismo trabajo');
    $service->deliver($order);
    expect(RepairPayment::where('orden_id', $order->id)->count())->toBe(2);
})->with([[true, 40000.0], [false, 45000.0]]);

it('records the full payment without a deposit and does not charge again when fully paid or archived', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Bateria', 'monto' => 15000]);
    $service->deliver($order, null, null, null, false);
    $payment = RepairPayment::where('orden_id', $order->id)->firstOrFail();
    expect((float) $payment->amount)->toBe(15000.0)
        ->and($payment->method)->toBe('transferencia');
    $paid = $service->create(['nombre_cliente' => 'Cliente pago', 'descripcion' => 'Bateria', 'monto' => 15000, 'senia' => 15000]);
    $service->deliver($paid);
    expect(RepairPayment::where('orden_id', $paid->id)->count())->toBe(1);
    $archived = $service->create(['nombre_cliente' => 'Archivado', 'descripcion' => 'Bateria', 'monto' => 15000]);
    $service->deliver($archived, null, null, null, null, true);
    expect(RepairPayment::where('orden_id', $archived->id)->count())->toBe(0);
});

it('settles delivery from every initial repair state including archived work', function (string $state): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Trabajo', 'monto' => 15000, 'senia' => 5000]);
    if ($state === 'ARCHIVADA') {
        $service->archive($order);
    } elseif ($state === 'CANCELADA') {
        $service->cancel($order, 'Cliente no acepta');
    } else {
        $service->updateState($order, $state);
    }
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), ['entrega_via' => 'ticket', 'abono_efectivo' => true])
        ->assertRedirect()->assertSessionHasNoErrors();
    $payment = RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->firstOrFail();
    expect((float) $payment->amount)->toBe(10000.0)
        ->and($order->refresh()->entregado)->toBe('si')
        ->and((float) $order->senia)->toBe(15000.0)
        ->and($order->archivado_at)->toBeNull();
})->with(['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'LISTA', 'CANCELADA', 'ARCHIVADA']);

it('settles delivery when selecting delivered through editing or the state action', function (string $entry): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Trabajo', 'monto' => 15000, 'senia' => 5000]);
    $payload = $entry === 'update' ? ['nombre_cliente' => 'Cliente', 'descripcion' => 'Trabajo', 'monto' => 15000, 'estado' => 'ENTREGADA'] : ['estado' => 'ENTREGADA'];
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route($entry === 'update' ? 'repairs.orders.update' : 'repairs.orders.state', $order), $payload)
        ->assertRedirect()->assertSessionHasNoErrors();
    expect($order->refresh()->entregado)->toBe('si')
        ->and((float) $order->senia)->toBe(15000.0)
        ->and((float) RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->firstOrFail()->amount)->toBe(10000.0);
})->with(['update', 'state']);

it('records a separate final payment for every unpaid work in bulk delivery', function (): void {
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'jobs' => [
        ['descripcion' => 'Pantalla', 'monto' => 15000, 'senia' => 5000],
        ['descripcion' => 'Bateria', 'monto' => 10000, 'senia' => 0],
        ['descripcion' => 'Pin', 'monto' => 5000, 'senia' => 5000],
    ]]);
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), ['entregar_todos' => true, 'abono_efectivo' => true, 'fecha_entregado' => '2026-11-18'])
        ->assertRedirect()->assertSessionHasNoErrors();
    $finals = RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->orderBy('reparacion')->get();
    expect($finals)->toHaveCount(2);
    foreach ($finals as $payment) {
        expect((float) $payment->amount)->toBe(10000.0)
            ->and($payment->paid_at->format('Y-m-d'))->toBe('2026-11-18');
    }
    expect(\App\Models\RepairOrder::where('id', $order->id)->where('entregado', 'si')->count())->toBe(3);
    $this->post(route('repairs.orders.deliver', $order), ['entregar_todos' => true, 'entrega_via' => 'ticket'])->assertRedirect();
    expect(RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->count())->toBe(2);
});

it('corrects the final payment method and price without duplicating it or changing its date', function (): void {
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_enabled', '1');
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_threshold', '30000');
    \App\Models\SiteGlobalConfig::putValue('repair_cash_discount_percentage', '10');
    $service = app(RepairService::class);
    $order = $service->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 50000, 'senia' => 10000]);
    $service->deliver($order, '2026-11-17', 'ticket', null, true);
    $payment = RepairPayment::where('orden_id', $order->id)->where('notes', 'Pago final de entrega')->firstOrFail();
    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), ['abono_efectivo' => false])
        ->assertRedirect()->assertSessionHasNoErrors();
    expect($payment->refresh()->method)->toBe('transferencia')
        ->and((float) $payment->amount)->toBe(45000.0)
        ->and($payment->paid_at->format('Y-m-d'))->toBe('2026-11-17')
        ->and((float) $order->refresh()->senia)->toBe(55000.0);
    $this->post(route('repairs.orders.deliver', $order), ['abono_efectivo' => true])->assertRedirect();
    expect($payment->refresh()->method)->toBe('efectivo')
        ->and((float) $payment->amount)->toBe(40000.0)
        ->and((float) $order->refresh()->senia)->toBe(50000.0)
        ->and(RepairPayment::where('orden_id', $order->id)->count())->toBe(2);
});
