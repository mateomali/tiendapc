<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

it('requires authentication for admin dashboard', function (): void {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

it('renders admin dashboard for admin users', function (): void {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/DashboardPage'));
});

it('locks the admin login after repeated invalid attempts', function (): void {
    User::query()->create([
        'name' => 'Admin Legacy',
        'email' => 'admin-rate@tienda.local',
        'password' => Hash::make('clave-correcta'),
        'role' => 'admin',
    ]);

    for ($attempt = 1; $attempt <= 5; $attempt++) {
        $response = $this->from(route('login'))->post(route('login.submit'), [
            'email' => 'admin-rate@tienda.local',
            'password' => 'incorrecta',
        ]);

        $response->assertRedirect(route('login'));
    }

    $this->from(route('login'))->post(route('login.submit'), [
        'email' => 'admin-rate@tienda.local',
        'password' => 'incorrecta',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('error', fn (?string $message): bool => is_string($message) && str_contains($message, 'Demasiados intentos'));
});
