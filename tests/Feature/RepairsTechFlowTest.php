<?php

use App\Models\RepairEvent;
use App\Models\RepairOrder;
use Inertia\Testing\AssertableInertia as Assert;

it('authenticates repair tech users and renders workbench', function (): void {
    $this->post(route('repairs.login.submit'), [
        'password' => config('tienda.repair_tech_password'),
    ])->assertRedirect(route('repairs.workbench'));

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Repairs/WorkbenchPage'));
});

it('shows delivered repairs in the dedicated technical view', function (): void {
    RepairOrder::query()->create([
        'id' => 501,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Carlos Gomez',
        'dni' => 33444555,
        'modelo' => 'Moto G',
        'descripcion' => 'Cambio de modulo',
        'estado' => 'ENTREGADA',
        'entregado' => 'si',
        'fecha_entregado' => now()->toDateString(),
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.delivered'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/DeliveredPage')
            ->has('tickets', 1));
});

it('creates multi-job repair orders and redirects to the technical ticket', function (): void {
    $response = $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.store'), [
            'nombre_cliente' => 'Lucia Gomez',
            'dni' => 30111222,
            'contacto' => '1133445566',
            'jobs' => [
                [
                    'modelo' => 'Moto G54',
                    'tipo_servicio' => 'modulo',
                    'descripcion' => '',
                    'observaciones' => 'Pantalla partida',
                    'monto' => 120000,
                    'senia' => 40000,
                    'fecha_estimada' => now()->addDays(2)->toDateString(),
                    'estado' => 'PENDIENTE',
                    'repuesto' => '',
                    'categorias_reparacion' => 1,
                ],
                [
                    'modelo' => 'Moto G54',
                    'tipo_servicio' => 'bateria',
                    'descripcion' => '',
                    'observaciones' => '',
                    'monto' => 45000,
                    'senia' => 10000,
                    'fecha_estimada' => now()->addDays(3)->toDateString(),
                    'estado' => 'PENDIENTE',
                    'repuesto' => '',
                    'categorias_reparacion' => 1,
                ],
            ],
        ]);

    $orderId = (int) RepairOrder::query()->max('id');

    $response->assertRedirect(route('repairs.tickets.show', ['orderId' => $orderId]));

    expect(RepairOrder::query()->where('id', $orderId)->count())->toBe(2);
    expect(RepairOrder::query()->where('id', $orderId)->orderBy('reparacion')->pluck('descripcion')->all())
        ->toBe([
            'Cambio de modulo Moto G54',
            'Cambio de bateria Moto G54',
        ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $orderId]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->where('ticket.nombre_cliente', 'Lucia Gomez')
            ->has('ticket.repairs', 2));
});

it('allows delivering repairs with explicit date and delivery channel', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 777,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Entrega',
        'dni' => 33444555,
        'modelo' => 'iPhone 11',
        'descripcion' => 'Cambio de bateria',
        'estado' => 'LISTA',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), [
            'fecha_entregado' => '2026-04-23',
            'entrega_via' => 'ticket',
        ])
        ->assertRedirect();

    $updated = $order->fresh();

    expect($updated?->entregado)->toBe('si');
    expect(optional($updated?->fecha_entregado)->format('Y-m-d'))->toBe('2026-04-23');
    expect(RepairEvent::query()->where('orden_id', 777)->where('evento', 'ENTREGA_VIA_TICKET')->exists())->toBeTrue();
});
