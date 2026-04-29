<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders sales index and create pages with enriched props', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $category = Category::query()->create([
        'name' => 'Cables',
        'slug' => 'cables',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cable USB',
        'slug' => 'cable-usb',
        'sku' => 'USB-01',
        'price' => 3500,
        'image_url' => '/assets/uploads/products/cable-usb.webp',
        'is_active' => true,
        'is_featured' => true,
    ]);

    $this->actingAs($user)
        ->get(route('admin.sales.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesPage')
            ->where('pagination.total', 0));

    $this->actingAs($user)
        ->get(route('admin.sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SaleFormPage')
            ->has('suggestedProducts', 1)
            ->where('features.cameraScanner', true));
});

it('creates and deletes sales through admin api without losing ticket access', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $category = Category::query()->create([
        'name' => 'Telefonia',
        'slug' => 'telefonia',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    $product = Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cargador',
        'slug' => 'cargador',
        'sku' => 'CAR-01',
        'price' => 9000,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('admin.api.sales.store'), [
            'customer_label' => 'Juan Perez',
            'notes' => 'Venta de prueba',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit_price' => 9000,
                ],
            ],
        ])
        ->assertOk()
        ->assertJson(['ok' => true]);

    $saleId = $response->json('id');

    expect($saleId)->not->toBeNull();
    expect(Sale::query()->count())->toBe(1);

    $this->actingAs($user)
        ->get(route('admin.sales.ticket', $saleId))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/TicketPage')
            ->where('sale.customer_label', 'Juan Perez')
            ->has('sale.items', 1));

    $this->actingAs($user)
        ->postJson(route('admin.api.sales.delete', $saleId))
        ->assertOk()
        ->assertJson(['deleted' => true]);

    expect(Sale::query()->count())->toBe(0);
});
