<?php

use App\Models\RepairEvent;
use App\Models\RepairDeviceModel;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairServiceOption;
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
                    'marca' => 'MOTOROLA',
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
                    'marca' => 'MOTOROLA',
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
    expect(RepairPayment::query()->where('orden_id', $orderId)->count())->toBe(2);
    expect(RepairOrder::query()->where('id', $orderId)->orderBy('reparacion')->pluck('descripcion')->all())
        ->toBe([
            'CAMBIO DE MODULO',
            'CAMBIO DE BATERIA',
        ]);
    expect(RepairOrder::query()->where('id', $orderId)->orderBy('reparacion')->pluck('marca')->all())
        ->toBe(['MOTOROLA', 'MOTOROLA']);
    expect(RepairDeviceModel::query()->where('model', 'MOTO G54')->value('usage_count'))->toBe(2);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $orderId]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->where('ticket.nombre_cliente', 'Lucia Gomez')
            ->has('ticket.repairs', 2));
});

it('uses the device model catalog to keep repair model names unified', function (): void {
    RepairDeviceModel::query()->create([
        'category_id' => 1,
        'brand' => 'SAMSUNG',
        'model' => 'SAMSUNG A52',
        'normalized_model' => 'SAMSUNG A52',
        'usage_count' => 3,
    ]);

    $response = $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.store'), [
            'nombre_cliente' => 'Modelo Canonico',
            'dni' => 30999111,
            'jobs' => [[
                'modelo' => 'samsung a52',
                'descripcion' => 'Cambio de modulo',
                'observaciones' => '',
                'monto' => 1000,
                'senia' => 0,
                'estado' => 'PENDIENTE',
                'repuesto' => '',
                'categorias_reparacion' => 1,
            ]],
        ]);

    $order = RepairOrder::query()->latest('id')->firstOrFail();

    $response->assertRedirect(route('repairs.tickets.show', ['orderId' => $order->id]));
    expect($order->modelo)->toBe('A52');
    expect(RepairDeviceModel::query()->where('model', 'A52')->where('brand', 'SAMSUNG')->value('usage_count'))->toBe(4);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.ingress'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('deviceModels.0.model', 'A52')
            ->where('serviceOptionUsage.service:modulo', 1));
});

it('allows managing repair intake lists', function (): void {
    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.lists'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/ListsPage')
            ->has('serviceOptions')
            ->has('deviceModels'));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.lists.service_options.store'), [
            'type' => 'failure',
            'label' => 'Microfono',
            'description' => 'Falla de microfono.',
        ])
        ->assertRedirect();

    expect(RepairServiceOption::query()->where('type', 'failure')->where('label', 'Microfono')->exists())->toBeTrue();

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.lists.device_models.store'), [
            'category_id' => 1,
            'brand' => 'ALCATEL',
            'model' => 'alcatel 1se',
        ])
        ->assertRedirect();

    expect(RepairDeviceModel::query()->where('model', '1SE')->where('brand', 'ALCATEL')->exists())->toBeTrue();
});

it('stores successive repair payments as history and updates paid total', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 801,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Pagos',
        'dni' => 33444111,
        'modelo' => 'Notebook',
        'descripcion' => 'Cambio de teclado',
        'monto' => 50000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.store', $order), [
            'amount' => 10000,
            'payment_type' => 'senia',
            'method' => 'efectivo',
            'notes' => 'Primer pago',
            'paid_at' => '2026-05-30',
        ])
        ->assertRedirect();

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.store', $order), [
            'amount' => 15000,
            'payment_type' => 'pago',
            'paid_at' => '2026-05-31',
        ])
        ->assertRedirect();

    expect(RepairPayment::query()->where('orden_id', 801)->where('reparacion', 1)->count())->toBe(2);
    expect((float) $order->fresh()?->senia)->toBe(25000.0);

    $payment = RepairPayment::query()->where('orden_id', 801)->where('amount', 10000)->firstOrFail();

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.delete', [$order, $payment]))
        ->assertRedirect();

    expect(RepairPayment::query()->where('orden_id', 801)->where('reparacion', 1)->count())->toBe(1);
    expect((float) $order->fresh()?->senia)->toBe(15000.0);
});

it('generates a verifier token for tickets without dni and uses it for public tracking', function (): void {
    $response = $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.store'), [
            'nombre_cliente' => 'Sin DNI',
            'dni' => config('tienda.repair_default_dni'),
            'contacto' => '',
            'jobs' => [[
                'modelo' => 'Moto E',
                'descripcion' => 'Revision',
                'observaciones' => '',
                'monto' => 12000,
                'senia' => 0,
                'fecha_estimada' => now()->addDay()->toDateString(),
                'estado' => 'PENDIENTE',
                'repuesto' => '',
                'categorias_reparacion' => 1,
            ]],
        ]);

    $order = RepairOrder::query()->latest('id')->firstOrFail();
    $token = (string) $order->tracking_token;

    $response->assertRedirect(route('repairs.tickets.show', ['orderId' => $order->id]));
    expect($token)->toMatch('/^\d{5}$/');

    $this->get(route('repairs.tracking', ['id_buscado' => $order->id, 'dni_buscado' => $token]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('searched', true)
            ->has('results', 1));

    $this->get(route('repairs.tracking', ['id_buscado' => $order->id, 'dni_buscado' => config('tienda.repair_default_dni')]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('searched', true)
            ->has('results', 0));
});

it('renders repair business metrics', function (): void {
    RepairOrder::query()->create([
        'id' => 811,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Metricas',
        'dni' => 30111222,
        'modelo' => 'Samsung A52',
        'descripcion' => 'Cambio de modulo',
        'monto' => 80000,
        'senia' => 20000,
        'estado' => 'LISTA',
        'entregado' => 'no',
    ]);

    RepairOrder::query()->create([
        'id' => 812,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Metricas Entregada',
        'dni' => 30111223,
        'modelo' => 'Samsung A52',
        'descripcion' => 'Cambio de modulo',
        'monto' => 30000,
        'senia' => 30000,
        'estado' => 'LISTA',
        'entregado' => 'si',
        'fecha_entregado' => now()->toDateString(),
    ]);

    RepairOrder::query()->create([
        'id' => 813,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Metricas Pendiente',
        'dni' => 30111224,
        'modelo' => 'Motorola G',
        'descripcion' => 'Revision general',
        'monto' => 50000,
        'senia' => 10000,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    RepairPayment::query()->create([
        'orden_id' => 811,
        'reparacion' => 1,
        'amount' => 20000,
        'payment_type' => 'senia',
        'paid_at' => now()->toDateString(),
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.metrics'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/MetricsPage')
            ->where('metrics.totals.monthBilled', 160000)
            ->where('metrics.totals.monthPaid', 60000)
            ->where('metrics.totals.openBalance', 60000)
            ->where('metrics.counts.delivered', 1)
            ->where('metrics.topWorkTypes.0.label', 'Cambio de modulo/pantalla'));
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
    expect($second->fresh()?->modelo)->toBe('JOYSTICK PS4 V2');
    expect($second->fresh()?->descripcion)->toBe('CAMBIO DE PIN DE CARGA');
    expect($second->fresh()?->estado)->toBe('EN REPARACION');
});

it('stores internal info notes for the whole repair order', function (): void {
    $first = RepairOrder::query()->create([
        'id' => 930,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Info',
        'dni' => 30111222,
        'modelo' => 'Moto G',
        'descripcion' => 'No carga',
        'observaciones' => 'sin observaciones',
        'monto' => 18000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $second = RepairOrder::query()->create([
        'id' => 930,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Info',
        'dni' => 30111222,
        'modelo' => 'Joystick',
        'descripcion' => 'Cambio de pin',
        'observaciones' => 'sin observaciones',
        'monto' => 9000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.info', $first), [
            'info' => 'Avisar antes de cambiar pin.',
        ])
        ->assertRedirect();

    expect($first->fresh()?->info)->toBe('Avisar antes de cambiar pin.')
        ->and($second->fresh()?->info)->toBe('Avisar antes de cambiar pin.');

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => '930']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('tickets.0.info', 'Avisar antes de cambiar pin.'));
});

it('reads internal order info from any job in the ticket', function (): void {
    RepairOrder::query()->create([
        'id' => 931,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Info Base',
        'dni' => 30111225,
        'modelo' => 'Moto G',
        'descripcion' => 'No carga',
        'observaciones' => 'sin observaciones',
        'monto' => 18000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
        'info' => null,
    ]);

    RepairOrder::query()->create([
        'id' => 931,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Info Base',
        'dni' => 30111225,
        'modelo' => 'Joystick',
        'descripcion' => 'Cambio de pin',
        'observaciones' => 'sin observaciones',
        'monto' => 9000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
        'info' => 'Nota guardada en otro trabajo.',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => '931']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('tickets.0.info', 'Nota guardada en otro trabajo.'));
});
