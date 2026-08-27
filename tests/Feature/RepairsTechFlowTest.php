<?php

use App\Models\RepairEvent;
use App\Models\RepairAnnotation;
use App\Models\RepairDeviceModel;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairServiceOption;
use App\Models\SiteGlobalConfig;
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

it('prefills a new repair order from a delivered search result', function (): void {
    RepairOrder::query()->create([
        'id' => 502,
        'reparacion' => 1,
        'fecha' => now()->subDays(10)->toDateString(),
        'nombre_cliente' => 'Maria Perez',
        'dni' => 27888999,
        'contacto' => '1155667788',
        'modelo' => 'Moto E',
        'descripcion' => 'Cambio de bateria',
        'estado' => 'ENTREGADA',
        'entregado' => 'si',
        'fecha_entregado' => now()->subDay()->toDateString(),
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => 'Maria']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->has('deliveredSearchTickets', 1)
            ->where('deliveredSearchTickets.0.newOrderUrl', route('repairs.ingress', ['from_order' => 502])));

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.ingress', ['from_order' => 502]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('pageMode', 'ingreso')
            ->where('initialCreateClient.nombre_cliente', 'Maria Perez')
            ->where('initialCreateClient.dni', 27888999)
            ->where('initialCreateClient.contacto', '1155667788'));
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

it('finds active repairs by model from consultations search', function (): void {
    RepairOrder::query()->create([
        'id' => 1907,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Lautaro',
        'dni' => 12345678,
        'modelo' => 'Moto Edge 40',
        'descripcion' => 'No enciende',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => 'Edge 40', 'q_fields' => ['modelo']]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->has('tickets', 1)
            ->where('tickets.0.id', 1907)
            ->where('tickets.0.repairs.0.modelo', 'Moto Edge 40'));
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
                    'color' => 'Azul',
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
    expect(RepairOrder::query()->where('id', $orderId)->orderBy('reparacion')->pluck('color')->all())
        ->toBe(['Azul', null]);
    expect(RepairDeviceModel::query()->where('model', 'MOTO G54')->value('usage_count'))->toBe(2);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $orderId]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->where('ticket.nombre_cliente', 'Lucia Gomez')
            ->where('ticket.hasClientDni', true)
            ->where('ticket.trackingVerifierLabel', 'DNI')
            ->where('ticket.trackingVerifier', '30111222')
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
            'payment_type' => 'senia',
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

it('stores repair increments as ticket additions without counting them as payments', function (): void {
    SiteGlobalConfig::putValue('repair_cash_discount_enabled', '1');
    SiteGlobalConfig::putValue('repair_cash_discount_threshold', '25000');
    SiteGlobalConfig::putValue('repair_cash_discount_percentage', '15');
    SiteGlobalConfig::putValue('repair_cash_discount_note', 'Precio efectivo configurado para reparaciones.');

    $order = RepairOrder::query()->create([
        'id' => 802,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Incremento',
        'dni' => 33444222,
        'modelo' => 'Moto E32',
        'descripcion' => 'Cambio de modulo',
        'monto' => 35000,
        'senia' => 10000,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.store', $order), [
            'amount' => 5000,
            'payment_type' => 'incremento',
            'notes' => 'Pin de carga',
            'paid_at' => '2026-06-21',
        ])
        ->assertRedirect();

    $order->refresh();
    expect((float) $order->monto)->toBe(40000.0);
    expect((float) $order->senia)->toBe(10000.0);

    $increment = RepairPayment::query()
        ->where('orden_id', 802)
        ->where('reparacion', 1)
        ->where('payment_type', 'incremento')
        ->firstOrFail();

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => 802]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->where('summary.totalMonto', 40000)
            ->where('summary.totalSenia', 10000)
            ->where('summary.saldo', 30000)
            ->where('ticketPricing.cashDiscountEnabled', true)
            ->where('ticketPricing.cashDiscountThreshold', 25000)
            ->where('ticketPricing.cashDiscountPercentage', 15)
            ->where('ticketPricing.cashDiscountNote', 'Precio efectivo configurado para reparaciones.')
            ->where('ticket.totalMonto', 40000)
            ->where('ticket.totalSenia', 10000)
            ->where('ticket.repairs.0.monto', '40000.00')
            ->where('ticket.repairs.0.senia', '10000.00')
            ->where('ticket.repairs.0.payments.0.payment_type', 'incremento')
            ->where('ticket.repairs.0.payments.0.notes', 'Pin de carga')
            ->where('ticket.repairs.0.payments.0.amount', '5000.00'));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.payments.delete', [$order, $increment]))
        ->assertRedirect();

    $order->refresh();
    expect((float) $order->monto)->toBe(35000.0);
    expect((float) $order->senia)->toBe(10000.0);
});

it('renders daily repair log without intake events', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 803,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Log',
        'dni' => 33444333,
        'modelo' => 'Moto G52',
        'descripcion' => 'Cambio de pantalla',
        'monto' => 45000,
        'senia' => 10000,
        'estado' => 'LISTA',
        'entregado' => 'no',
    ]);

    RepairEvent::query()->create([
        'orden_id' => $order->id,
        'reparacion' => 1,
        'usuario' => 'panel',
        'evento' => 'CREADA',
        'estado_anterior' => null,
        'estado_nuevo' => 'PENDIENTE',
        'created_at' => now()->setTime(8, 0),
    ]);

    RepairEvent::query()->create([
        'orden_id' => $order->id,
        'reparacion' => 1,
        'usuario' => 'panel',
        'evento' => 'ACTUALIZADA',
        'estado_anterior' => 'PENDIENTE',
        'estado_nuevo' => 'LISTA',
        'created_at' => now()->setTime(9, 30),
    ]);

    RepairEvent::query()->create([
        'orden_id' => $order->id,
        'reparacion' => 1,
        'usuario' => 'panel',
        'evento' => 'ENTREGADA',
        'estado_anterior' => 'LISTA',
        'estado_nuevo' => 'ENTREGADA',
        'created_at' => now()->setTime(10, 15),
    ]);

    RepairEvent::query()->create([
        'orden_id' => $order->id,
        'reparacion' => 1,
        'usuario' => 'panel',
        'evento' => 'CANCELADA',
        'estado_anterior' => 'PENDIENTE',
        'estado_nuevo' => 'CANCELADA',
        'created_at' => now()->subDay()->setTime(11, 0),
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.log'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/LogPage')
            ->where('date', now()->toDateString())
            ->where('summary.total', 2)
            ->where('summary.delivered', 1)
            ->where('summary.cancelled', 0)
            ->where('summary.updated', 1)
            ->has('events', 2)
            ->where('events.0.event', 'ENTREGADA')
            ->where('events.0.customerName', 'Cliente Log')
            ->where('events.0.model', 'Moto G52')
            ->where('events.1.event', 'ACTUALIZADA'));
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

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => $order->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->where('ticket.hasClientDni', false)
            ->where('ticket.trackingVerifierLabel', 'PIN')
            ->where('ticket.trackingVerifier', $token));

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

    RepairOrder::query()->create([
        'id' => 814,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Metricas Cancelada',
        'dni' => 30111225,
        'modelo' => 'Xiaomi Redmi',
        'descripcion' => 'Cambio de bateria',
        'monto' => 90000,
        'senia' => 15000,
        'estado' => 'CANCELADA',
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
            ->where('metrics.totals.monthBilled', 60000)
            ->where('metrics.totals.monthPaid', 60000)
            ->where('metrics.totals.profitPercentage', 20)
            ->where('metrics.totals.monthRealProfit', 10000)
            ->where('metrics.totals.openBalance', 60000)
            ->where('metrics.counts.delivered', 1)
            ->where('metrics.topWorkTypes.0.label', 'Cambio de modulo/pantalla'));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.metrics.settings.save'), [
            'profit_percentage' => 50,
        ])
        ->assertRedirect();

    expect(SiteGlobalConfig::value('repair_metrics_profit_percentage'))->toBe('50');

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.metrics'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('metrics.totals.profitPercentage', 50)
            ->where('metrics.totals.monthRealProfit', 20000));
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

it('keeps delivered job data visible when reopening a multi job ticket', function (): void {
    RepairOrder::query()->create([
        'id' => 779,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Ticket Mixto',
        'dni' => 33444557,
        'modelo' => 'Equipo Entregado',
        'descripcion' => 'Trabajo terminado',
        'monto' => 25000,
        'senia' => 5000,
        'estado' => 'LISTA',
        'entregado' => 'si',
        'fecha_entregado' => '2026-04-25',
    ]);
    RepairOrder::query()->create([
        'id' => 779,
        'reparacion' => 2,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Ticket Mixto',
        'dni' => 33444557,
        'modelo' => 'Equipo Activo',
        'descripcion' => 'Trabajo pendiente',
        'monto' => 18000,
        'senia' => 0,
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.tickets.show', ['orderId' => 779]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/TicketPage')
            ->has('ticket.repairs', 2)
            ->where('ticket.repairs.0.monto', '25000.00')
            ->where('ticket.repairs.0.senia', '5000.00')
            ->where('ticket.repairs.0.entregado', 'si')
            ->where('ticket.repairs.0.fecha_entregado', '2026-04-25')
            ->where('ticket.repairs.1.entregado', 'no'));
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

it('cancels repairs with a reason without archiving them', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 780,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Cancela',
        'dni' => 33444558,
        'modelo' => 'Moto E',
        'descripcion' => 'Cambio de modulo',
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.cancel', $order), [
            'cancelado_motivo' => 'Cliente no autoriza el presupuesto.',
        ])
        ->assertRedirect();

    $updated = $order->fresh();

    expect($updated?->estado)->toBe('CANCELADA');
    expect($updated?->entregado)->toBe('no');
    expect($updated?->archivado_at)->toBeNull();
    expect($updated?->cancelado_motivo)->toBe('Cliente no autoriza el presupuesto.');
    expect(RepairEvent::query()->where('orden_id', 780)->where('evento', 'CANCELADA')->exists())->toBeTrue();

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['estado' => 'CANCELADA']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('tickets.0.repairs.0.estado', 'CANCELADA')
            ->where('tickets.0.repairs.0.cancelado_motivo', 'Cliente no autoriza el presupuesto.'));
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
    expect(RepairAnnotation::query()->where('source', 'order_info')->where('repair_order_id', 930)->value('body'))
        ->toBe('Avisar antes de cambiar pin.');

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['q' => '930']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('tickets.0.info', 'Avisar antes de cambiar pin.'));
});

it('manages repair annotations as a dated log', function (): void {
    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.annotations'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/AnnotationsPage')
            ->has('annotations', 0));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.annotations.store'), [
            'body' => 'Llego proveedor con repuestos.',
        ])
        ->assertRedirect();

    $annotation = RepairAnnotation::query()->firstOrFail();

    expect($annotation->body)->toBe('Llego proveedor con repuestos.')
        ->and($annotation->source)->toBe('manual');

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.annotations.update', $annotation), [
            'body' => 'Llego proveedor con repuestos y facturas.',
        ])
        ->assertRedirect();

    expect($annotation->fresh()?->body)->toBe('Llego proveedor con repuestos y facturas.');

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.annotations'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/AnnotationsPage')
            ->has('annotations', 1)
            ->where('annotations.0.body', 'Llego proveedor con repuestos y facturas.'));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.annotations.delete', $annotation))
        ->assertRedirect();

    expect(RepairAnnotation::query()->count())->toBe(0);
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
