<?php

use App\Models\RepairEvent;
use App\Models\RepairOrder;
use Inertia\Testing\AssertableInertia as Assert;

it('renders public repair tracking', function (): void {
    $this->get(route('repairs.tracking'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('searched', false)
            ->where('publicView.title', 'Estado de su reparación')
            ->where('publicView.submitLabel', 'Consultar')
            ->where('publicView.bannerUrl', asset('assets/img/repair-banner-legacy.png')));
});

it('filters repair tracking by id and dni', function (): void {
    RepairOrder::query()->create([
        'id' => 100,
        'reparacion' => 1,
        'nombre_cliente' => 'Juan Perez',
        'dni' => 12345678,
        'modelo' => 'PlayStation 4',
        'descripcion' => 'No enciende',
        'observaciones' => 'Falta repuesto',
        'monto' => 35000,
        'senia' => 5000,
        'estado' => 'PENDIENTE',
        'imagen' => 'orden_100_1_orig_1_demo.jpg',
        'imagen3' => 'orden_100_1_final_1_demo.jpg',
    ]);

    $this->get(route('repairs.tracking', ['id_buscado' => 100, 'dni_buscado' => 12345678]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('searched', true)
            ->where('publicView.showDniField', true)
            ->has('results', 1)
            ->where('results.0.repairs.0.model', 'PlayStation 4')
            ->has('results.0.repairs.0.entryImages', 1)
            ->has('results.0.repairs.0.finalImages', 1));
});

it('shows a public feedback message when no repair is found', function (): void {
    $this->get(route('repairs.tracking', ['id_buscado' => 999, 'dni_buscado' => 12345678]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('searched', true)
            ->where('feedback.message', 'No se encontro ninguna orden con el ID y verificador ingresados.'));
});

it('shows cancellation reason in public tracking', function (): void {
    $order = RepairOrder::query()->create([
        'id' => 101,
        'reparacion' => 1,
        'fecha' => now()->toDateString(),
        'nombre_cliente' => 'Maria Gomez',
        'dni' => 22111222,
        'modelo' => 'Samsung A12',
        'descripcion' => 'Cambio de modulo',
        'estado' => 'CANCELADA',
        'entregado' => 'no',
        'cancelado_motivo' => 'No se consigue repuesto compatible.',
    ]);

    RepairEvent::query()->create([
        'orden_id' => $order->id,
        'reparacion' => 1,
        'usuario' => 'panel',
        'evento' => 'CANCELADA',
        'estado_anterior' => 'PENDIENTE',
        'estado_nuevo' => 'CANCELADA',
        'created_at' => '2026-08-18 14:30:00',
    ]);

    $this->get(route('repairs.tracking', ['id_buscado' => 101, 'dni_buscado' => 22111222]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('results.0.repairs.0.status.variant', 'danger')
            ->where('results.0.repairs.0.status.message', 'Este trabajo fue cancelado. Motivo: No se consigue repuesto compatible.')
            ->where('results.0.repairs.0.status.announcedAt', '18/08/2026 14:30')
            ->where('results.0.repairs.0.status.pickup.title', 'Retiro del equipo'));
});
