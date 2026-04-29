<?php

use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia as Assert;

it('redirects home to catalog', function (): void {
    $this->get('/')->assertRedirect(route('store.catalog'));
});

it('renders the catalog page with sellable products', function (): void {
    $category = Category::query()->create([
        'name' => 'Celulares',
        'slug' => 'celulares',
        'group_key' => 'electronica',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Moto G',
        'slug' => 'moto-g',
        'price' => 100000,
        'stock' => 2,
        'is_active' => true,
    ]);

    $this->get(route('store.catalog'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Store/CatalogPage')
            ->has('products', 1)
            ->has('categories', 1));
});

it('renders the public repairs tracking page through the legacy accented url', function (): void {
    $this->get('/reparación')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Repairs/PublicTrackingPage')
            ->where('filters', [])
            ->where('searched', false)
            ->where('publicView.resetUrl', route('repairs.tracking')));
});
