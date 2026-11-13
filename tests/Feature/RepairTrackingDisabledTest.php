<?php

use App\Models\RepairOrder;
use App\Services\RepairService;
use Inertia\Testing\AssertableInertia as Assert;

it('removes public tracking for every work without deleting the order', function (bool $withDni): void {
    $service = app(RepairService::class);
    $order = $service->create([
        'nombre_cliente' => 'Cliente seguimiento',
        'dni' => $withDni ? 12345678 : null,
        'jobs' => [
            ['descripcion' => 'Pantalla', 'monto' => 10000],
            ['descripcion' => 'Bateria', 'monto' => 5000],
        ],
    ]);
    $verifier = $order->trackingVerifier();
    $query = ['id_buscado' => $order->id, 'dni_buscado' => $verifier];
    $this->get(route('repairs.tracking', $query))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', 1));

    $this->withSession(['repair_tech_authenticated' => true])
        ->post(route('repairs.orders.tracking.remove', $order))
        ->assertRedirect()->assertSessionHasNoErrors();

    $rows = RepairOrder::where('id', $order->id)->get();
    expect($rows)->toHaveCount(2);
    expect($rows->every(fn (RepairOrder $row): bool => $row->tracking_disabled))->toBeTrue();
    $this->get(route('repairs.tracking', $query))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', 0)->has('tickets', 0));
    $this->post(route('repairs.tracking'), ['orden' => $order->id, 'dni' => $verifier])->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', 0));
    $this->post(route('repairs.orders.tracking.restore', $order))
        ->assertRedirect()->assertSessionHasNoErrors();
    expect(RepairOrder::where('id', $order->id)->get()->every(fn (RepairOrder $row): bool => ! $row->tracking_disabled))->toBeTrue();
    $this->get(route('repairs.tracking', $query))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', 1));
    $this->post(route('repairs.tracking'), ['orden' => $order->id, 'dni' => $verifier])->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', 1));
})->with([true, false]);

it('requires technician authentication to remove tracking', function (): void {
    $order = app(RepairService::class)->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 10000]);
    $this->post(route('repairs.orders.tracking.remove', $order))->assertForbidden();
    expect($order->refresh()->tracking_disabled)->toBeFalse();
});

it('requires technician authentication to restore tracking', function (): void {
    $order = app(RepairService::class)->create(['nombre_cliente' => 'Cliente', 'descripcion' => 'Pantalla', 'monto' => 10000]);
    RepairOrder::where('id', $order->id)->update(['tracking_disabled' => true]);
    $this->post(route('repairs.orders.tracking.restore', $order))->assertForbidden();
    expect($order->refresh()->tracking_disabled)->toBeTrue();
});


it('expires delivered tracking at the configured day without hiding active jobs', function (int $days, int $age, bool $visible, bool $withDni): void {
    \App\Models\SiteGlobalConfig::putValue('repair_tracking_days', (string) $days);
    $this->travelTo(\Carbon\CarbonImmutable::parse('2026-11-12 12:00:00', 'America/Argentina/Buenos_Aires'));
    $service = app(RepairService::class);
    $order = $service->create([
        'nombre_cliente' => 'Cliente plazo',
        'dni' => $withDni ? 12345678 : null,
        'descripcion' => 'Pantalla',
        'monto' => 10000,
    ]);
    RepairOrder::where('id', $order->id)->update([
        'entregado' => 'si',
        'fecha_entregado' => \Carbon\CarbonImmutable::today('America/Argentina/Buenos_Aires')->subDays($age)->toDateString(),
    ]);
    $query = ['id_buscado' => $order->id, 'dni_buscado' => $order->trackingVerifier()];
    $this->get(route('repairs.tracking', $query))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', $visible ? 1 : 0));
    $this->post(route('repairs.tracking'), ['orden' => $order->id, 'dni' => $order->trackingVerifier()])->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('results', $visible ? 1 : 0));
    RepairOrder::where('id', $order->id)->update(['entregado' => 'no']);
    expect($service->track($order->id, $order->trackingVerifier()))->toHaveCount(1);
    $this->travelBack();
})->with([[60, 59, true, true], [60, 60, false, true], [60, 61, false, false], [10, 10, false, false], [90, 60, true, true]]);
