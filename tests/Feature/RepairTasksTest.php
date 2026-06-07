<?php

use App\Models\RepairOrder;
use App\Models\RepairTaskItem;
use App\Models\User;
use App\Services\RepairService;
use Inertia\Testing\AssertableInertia as Assert;

it('queues a repair row, moves it to in repair, and removes it from the queue when ready', function (): void {
    $user = User::factory()->create(['role' => 'admin']);
    $repair = RepairOrder::query()->create([
        'id' => 987,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Tarea',
        'dni' => 30111222,
        'contacto' => '1122334455',
        'modelo' => 'Notebook',
        'descripcion' => 'No carga sistema',
        'monto' => 10000,
        'senia' => 2000,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
        'categorias_reparacion' => 2,
    ]);
    $secondRepair = RepairOrder::query()->create([
        'id' => 988,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Segundo',
        'dni' => 30111223,
        'contacto' => '1122334456',
        'modelo' => 'PlayStation',
        'descripcion' => 'No enciende',
        'monto' => 12000,
        'senia' => 1000,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'PENDIENTE',
        'entregado' => 'no',
        'categorias_reparacion' => 3,
    ]);

    $this->actingAs($user)
        ->post(route('tasks.add_repair', $repair))
        ->assertRedirect()
        ->assertSessionHas('success');

    $item = RepairTaskItem::query()->where('repair_order_registro_id', $repair->registro_id)->firstOrFail();

    expect($item->completed_at)->toBeNull();
    expect($repair->refresh()->estado)->toBe('EN REPARACION');

    $this->actingAs($user)
        ->post(route('tasks.add_repair', $secondRepair))
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->actingAs($user)
        ->post(route('tasks.add_repair', $repair))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(RepairTaskItem::query()
        ->where('repair_order_registro_id', $repair->registro_id)
        ->whereNull('completed_at')
        ->count())->toBe(0);
    expect($repair->refresh()->estado)->toBe('PENDIENTE');

    $this->actingAs($user)
        ->post(route('tasks.add_repair', $repair))
        ->assertRedirect()
        ->assertSessionHas('success');

    $queuedRegistroIds = RepairTaskItem::query()
        ->whereDate('task_date', now()->toDateString())
        ->whereNull('completed_at')
        ->oldest('created_at')
        ->oldest('id')
        ->pluck('repair_order_registro_id')
        ->all();

    expect($queuedRegistroIds)->toBe([$secondRepair->registro_id, $repair->registro_id]);

    $item = RepairTaskItem::query()->where('repair_order_registro_id', $repair->registro_id)->whereNull('completed_at')->firstOrFail();

    $this->actingAs($user)
        ->get(route('tasks.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/TasksPage')
            ->has('items', 2)
            ->where('items.0.clientName', 'Cliente Segundo')
            ->where('items.1.clientName', 'Cliente Tarea')
            ->where('items.1.ticketId', 987)
            ->where('items.1.status', 'EN REPARACION')
        );

    $this->actingAs($user)
        ->post(route('tasks.complete', $item))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($item->refresh()->completed_at)->not->toBeNull();
    expect($repair->refresh()->estado)->toBe('LISTA');
});

it('removes a repair from tasks when the grid changes it to ready', function (): void {
    $repair = RepairOrder::query()->create([
        'id' => 989,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Listo',
        'dni' => 30111224,
        'contacto' => '1122334457',
        'modelo' => 'Xbox',
        'descripcion' => 'Limpieza',
        'monto' => 9000,
        'senia' => 0,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'EN REPARACION',
        'entregado' => 'no',
        'categorias_reparacion' => 3,
    ]);
    $item = RepairTaskItem::query()->create([
        'repair_order_registro_id' => $repair->registro_id,
        'task_date' => now()->toDateString(),
    ]);

    app(RepairService::class)->updateState($repair, 'LISTA');

    expect($item->refresh()->completed_at)->not->toBeNull();
});

it('filters consultation tickets by assigned tasks in fifo order', function (): void {
    $firstTicket = RepairOrder::query()->create([
        'id' => 991,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Primero',
        'dni' => 30111225,
        'contacto' => '1122334458',
        'modelo' => 'Notebook',
        'descripcion' => 'Pantalla sin imagen',
        'monto' => 15000,
        'senia' => 0,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'EN REPARACION',
        'entregado' => 'no',
        'categorias_reparacion' => 2,
    ]);
    $secondTicket = RepairOrder::query()->create([
        'id' => 992,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Segundo Filtro',
        'dni' => 30111226,
        'contacto' => '1122334459',
        'modelo' => 'PlayStation',
        'descripcion' => 'No da video',
        'monto' => 17000,
        'senia' => 0,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'EN REPARACION',
        'entregado' => 'no',
        'categorias_reparacion' => 3,
    ]);
    RepairOrder::query()->create([
        'id' => 993,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Cliente Fuera',
        'dni' => 30111227,
        'contacto' => '1122334460',
        'modelo' => 'Xbox',
        'descripcion' => 'Sin cola',
        'monto' => 9000,
        'senia' => 0,
        'fecha_estimada' => now()->toDateString(),
        'estado' => 'EN REPARACION',
        'entregado' => 'no',
        'categorias_reparacion' => 3,
    ]);

    RepairTaskItem::query()->create([
        'repair_order_registro_id' => $secondTicket->registro_id,
        'task_date' => now()->toDateString(),
    ]);
    RepairTaskItem::query()->create([
        'repair_order_registro_id' => $firstTicket->registro_id,
        'task_date' => now()->toDateString(),
    ]);

    $this->withSession(['repair_tech_authenticated' => true])
        ->get(route('repairs.workbench', ['prioridad' => 'tareas']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/WorkbenchPage')
            ->where('summary.tasks', 2)
            ->where('filters.prioridad', 'tareas')
            ->has('tickets', 2)
            ->where('tickets.0.id', 992)
            ->where('tickets.0.repairs.0.taskQueuePosition', 1)
            ->where('tickets.1.id', 991)
            ->where('tickets.1.repairs.0.taskQueuePosition', 2));
});
