<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteGlobalConfig;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders dedicated missing image and missing sku admin pages', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $category = Category::query()->create([
        'name' => 'Consolas',
        'slug' => 'consolas',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Joystick sin foto',
        'slug' => 'joystick-sin-foto',
        'sku' => 'JOY-01',
        'price' => 25000,
        'is_active' => true,
    ]);

    Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cable sin sku',
        'slug' => 'cable-sin-sku',
        'price' => 5000,
        'image_url' => '/assets/uploads/products/cable.webp',
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('admin.products.missing_images'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ProductMissingImagesPage')
            ->has('items', 1)
            ->where('items.0.name', 'Joystick sin foto'));

    $this->actingAs($user)
        ->get(route('admin.products.missing_sku'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ProductMissingSkusPage')
            ->has('items', 1)
            ->where('items.0.name', 'Cable sin sku'));
});

it('supports category visibility, reorder and merge flows', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $source = Category::query()->create([
        'name' => 'Audio',
        'slug' => 'audio',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    $target = Category::query()->create([
        'name' => 'Auriculares',
        'slug' => 'auriculares',
        'sort_order' => 2,
        'is_hidden' => false,
    ]);

    Product::query()->create([
        'category_id' => $source->id,
        'name' => 'Auricular gamer',
        'slug' => 'auricular-gamer',
        'price' => 30000,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->post(route('admin.categories.visibility', $source))
        ->assertRedirect();

    expect($source->fresh()?->is_hidden)->toBeTrue();

    $this->actingAs($user)
        ->post(route('admin.categories.reorder'), [
            'ordered_ids' => [$target->id, $source->id],
        ])
        ->assertRedirect();

    expect($target->fresh()?->sort_order)->toBe(1);
    expect($source->fresh()?->sort_order)->toBe(2);

    $this->actingAs($user)
        ->post(route('admin.categories.merge'), [
            'source_id' => $source->id,
            'target_id' => $target->id,
        ])
        ->assertRedirect();

    expect(Product::query()->where('category_id', $target->id)->count())->toBe(1);
    expect(Category::withTrashed()->find($source->id)?->deleted_at)->not->toBeNull();
});

it('supports quick product creation and inline rotation shortcut', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $category = Category::query()->create([
        'name' => 'Accesorios',
        'slug' => 'accesorios',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    $this->actingAs($user)
        ->post(route('admin.products.quick_store'), [
            'category_id' => $category->id,
            'name' => 'Soporte magnetico',
            'slug' => '',
            'sku' => 'SUP-01',
            'short_description' => '',
            'description' => '',
            'price' => 18000,
            'offer_price' => '',
            'stock' => 5,
            'stock_status' => 'instock',
            'image_url' => '/assets/uploads/products/soporte.webp',
            'image_url_2' => '',
            'image_url_3' => '',
            'is_featured' => 0,
            'is_active' => 1,
        ])
        ->assertRedirect(route('admin.products.index'));

    expect(Product::query()->where('name', 'Soporte magnetico')->exists())->toBeTrue();

    $this->actingAs($user)
        ->post(route('admin.products.rotation.save'), [
            'catalog_product_image_rotation_ms' => 7000,
        ])
        ->assertRedirect();

    expect(SiteGlobalConfig::value('catalog_product_image_rotation_ms'))->toBe('7000');
});
