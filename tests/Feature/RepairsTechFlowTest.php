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

it('finds active repairs by ticket id from consultations search', function (): void {
    RepairOrder::query()->create([
        'id' => 1906,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Carlos',
        'dni' => 12345678,
        'modelo' => 'Joystick PS4',
        'descripcion' => 'No carga',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => '1906']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->has('tickets', 1)
            ->where('tickets.0.id', 1906)
            ->where('tickets.0.repairs.0.modelo', 'Joystick PS4'));
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

it('allows moving cancelled repairs to delivered while preserving cancelled state', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 778,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Cancelado',
        'dni' => 33444556,
        'modelo' => 'Moto G',
        'descripcion' => 'No continua reparacion',
        'estado' => 'CANCELADA',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.deliver', $order), [
            'fecha_entregado' => '2026-04-24',
            'entrega_via' => 'persona',
        ])
        ->assertRedirect();

    $updated = $order->fresh();

    expect($updated?->entregado)->toBe('si');
    expect($updated?->estado)->toBe('CANCELADA');
    expect(optional($updated?->fecha_entregado)->format('Y-m-d'))->toBe('2026-04-24');

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.delivered', ['q' => 'Cliente Cancelado']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/DeliveredPage')
            ->where('tickets.0.repairs.0.estado', 'CANCELADA'));
});

it('marks only the selected job as ready in a multi-job ticket', function (): void {
    $first = RepairOrder::query()->create([
        'id' => 913,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Facundo Fernandez',
        'dni' => 12345678,
        'modelo' => 'E15 MODULO',
        'descripcion' => 'Cambio de modulo E15',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $second = RepairOrder::query()->create([
        'id' => 913,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Facundo Fernandez',
        'dni' => 12345678,
        'modelo' => 'SAMSUNG a33',
        'descripcion' => 'Cambio de modulo Samsung a33',
        'estado' => 'EN REPARACION',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.mark_ready', $second))
        ->assertRedirect();

    expect($first->fresh()?->estado)->toBe('PENDIENTE');
    expect($second->fresh()?->estado)->toBe('LISTA');
});

it('cycles only the selected job state from the desktop status action', function (): void {
    $first = RepairOrder::query()->create([
        'id' => 915,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Estado',
        'dni' => 30111222,
        'modelo' => 'Equipo A',
        'descripcion' => 'Trabajo A',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $second = RepairOrder::query()->create([
        'id' => 915,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Estado',
        'dni' => 30111222,
        'modelo' => 'Equipo B',
        'descripcion' => 'Trabajo B',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $third = RepairOrder::query()->create([
        'id' => 915,
        'reparacion' => 3,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Estado',
        'dni' => 30111222,
        'modelo' => 'Equipo C',
        'descripcion' => 'Trabajo C',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.state', $second), [
            'estado' => 'EN REPARACION',
        ])
        ->assertRedirect();

    expect($first->fresh()?->estado)->toBe('PENDIENTE');
    expect($first->fresh()?->modelo)->toBe('Equipo A');
    expect($second->fresh()?->estado)->toBe('EN REPARACION');
    expect($second->fresh()?->modelo)->toBe('Equipo B');
    expect($third->fresh()?->estado)->toBe('PENDIENTE');
    expect($third->fresh()?->modelo)->toBe('Equipo C');
});

it('updates only the selected job details in a multi-job ticket', function (): void {
    $first = RepairOrder::query()->create([
        'id' => 914,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Multiple',
        'dni' => 30111222,
        'modelo' => 'Notebook',
        'descripcion' => 'No enciende',
        'observaciones' => 'sin observaciones',
        'monto' => 35000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $second = RepairOrder::query()->create([
        'id' => 914,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Multiple',
        'dni' => 30111222,
        'modelo' => 'Joystick PS4',
        'descripcion' => 'No carga',
        'observaciones' => 'sin observaciones',
        'monto' => 15000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.update', $second), [
            'id_nuevo' => 914,
            'fecha' => now()->toDateString(),
            'nombre_cliente' => 'Cliente Multiple',
            'dni' => 30111222,
            'contacto' => '',
            'modelo' => 'Joystick PS4 V2',
            'descripcion' => 'Cambio de pin de carga',
            'observaciones' => 'Probado en mesa',
            'monto' => 22000,
            'senia' => 0,
            'fecha_estimada' => null,
            'estado' => 'EN REPARACION',
            'repuesto' => '',
            'repuesto_pedido' => false,
            'inventory_part_id' => '',
            'categorias_reparacion' => 4,
        ])
        ->assertRedirect();

    expect($first->fresh()?->modelo)->toBe('Notebook');
    expect($first->fresh()?->descripcion)->toBe('No enciende');
    expect($first->fresh()?->estado)->toBe('PENDIENTE');
    expect($second->fresh()?->modelo)->toBe('Joystick PS4 V2');
    expect($second->fresh()?->descripcion)->toBe('Cambio de pin de carga');
    expect($second->fresh()?->estado)->toBe('EN REPARACION');
});
