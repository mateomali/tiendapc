<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\RepairDeviceModel;
use App\Models\RepairOrder;
use App\Models\SiteGlobalConfig;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

it('redirects home to catalog', function (): void {
    $this->get('/')->assertRedirect(route('store.catalog'));
});

it('quotes a phone repair using the latest matching historical price with monthly increment', function (): void {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-18 12:00:00'));
    SiteGlobalConfig::putValue('repair_quote_monthly_increment_percentage', '10');

    $model = RepairDeviceModel::query()->create([
        'category_id' => 1,
        'brand' => 'MOTOROLA',
        'model' => 'G8 PLUS',
        'normalized_model' => 'G8 PLUS',
        'usage_count' => 4,
    ]);

    RepairOrder::query()->create([
        'id' => 900,
        'reparacion' => 1,
        'fecha' => '2026-06-05',
        'nombre_cliente' => 'Cliente',
        'modelo' => 'MOTOROLA G8 PLUS',
        'descripcion' => 'CAMBIO DE MODULO',
        'monto' => 100000,
        'estado' => 'REPARADO',
        'entregado' => 'si',
        'categorias_reparacion' => 1,
    ]);

    $this->get(route('store.repair_quote', [
        'modelo' => $model->id,
        'falla' => 'CAMBIO DE MODULO',
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Store/RepairQuotePage')
            ->where('selected.modelId', $model->id)
            ->where('selected.failure', 'CAMBIO DE MODULO')
            ->where("failuresByModel.{$model->id}.0.value", 'CAMBIO DE MODULO')
            ->where('result.basePrice', 100000)
            ->where('result.estimatedPrice', 121000)
            ->where('result.monthsOld', 2)
            ->where('result.monthlyIncrementPercentage', 10));

    CarbonImmutable::setTestNow();
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

it('keeps category totals when filtering products', function (): void {
    foreach (['audio', 'cables'] as $slug) {
        $category = Category::query()->create(['name' => $slug, 'slug' => $slug, 'group_key' => 'electronica', 'is_hidden' => false]);
        Product::query()->create(['category_id' => $category->id, 'name' => $slug, 'slug' => $slug, 'price' => 100, 'is_active' => true]);
    }
    Product::query()->create(['category_id' => $category->id, 'name' => 'Inactive', 'slug' => 'inactive', 'price' => 100, 'is_active' => false]);
    foreach ([['categoria' => 'audio'], ['q' => 'audio'], ['categorias' => ['audio']], ['ofertas' => 1]] as $filters) {
        $this->get(route('store.catalog', $filters))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.0.productCount', 1)
                ->where('categories.1.productCount', 1)
                ->where('groups.0.productCount', 2));
    }
});

it('provides numeric prices for the detail savings with offer and cash discount', function (): void {
    SiteGlobalConfig::putValue('product_cash_discount_enabled', '1');
    SiteGlobalConfig::putValue('product_cash_discount_threshold', '0');
    $category = Category::query()->create(['name' => 'Audio', 'slug' => 'detail-audio', 'group_key' => 'electronica', 'is_hidden' => false]);
    Product::query()->create(['category_id' => $category->id, 'name' => 'Speaker', 'slug' => 'detail-speaker', 'price' => 10000, 'offer_price' => 8000, 'cash_discount_mode' => 'manual', 'cash_price' => 7000, 'is_active' => true]);
    $this->get(route('store.product.show', 'detail-speaker'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('product.price', 10000)
            ->where('product.displayPrice', 8000)
            ->where('product.cashPrice', 7000));
});
