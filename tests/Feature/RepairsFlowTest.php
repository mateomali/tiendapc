<?php

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
            ->where('publicView.showDniField', false)
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
            ->where('feedback.message', 'No se encontró ninguna orden con el ID y DNI ingresados.'));
});
