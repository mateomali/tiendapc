<?php

use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\SiteAnnouncement;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use App\Models\SiteService;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders rich admin site pages with legacy-oriented props', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    MediaAsset::query()->create([
        'title' => 'Banner home',
        'file_url' => '/assets/uploads/library/banner-home.webp',
        'tags' => 'banner,home',
        'mime_type' => 'image/webp',
        'file_size' => 1024,
        'width' => 1200,
        'height' => 400,
    ]);

    SiteAnnouncement::query()->create([
        'message' => 'Promo del mes',
        'link_url' => '/productos',
        'display_type' => 'image',
        'image_url' => '/assets/uploads/library/banner-home.webp',
        'sort_order' => 1,
        'is_active' => true,
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHour(),
    ]);

    SiteContactConfig::query()->create([
        'id' => 1,
        'whatsapp_number' => '5491122334455',
        'contact_title' => 'Contactanos',
        'contact_description' => 'Atencion al cliente',
        'contact_email' => 'hola@tienda.local',
    ]);

    SiteGlobalConfig::putValue('whatsapp_number', '5491122334455');
    SiteGlobalConfig::putValue('footer_cta_title', 'Escribinos');
    SiteGlobalConfig::putValue('catalog_empty_text', 'Sin resultados');

    SiteService::query()->create([
        'title' => 'Cambio de modulo',
        'subtitle' => 'Reparaciones',
        'description' => 'Servicio tecnico especializado',
        'points_text' => "Diagnostico\nGarantia",
        'image_url' => '/assets/uploads/library/banner-home.webp',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get(route('admin.announcements.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AnnouncementsPage')
            ->has('items', 1)
            ->has('mediaItems', 1)
            ->where('items.0.status_label', 'activo'));

    $this->actingAs($user)
        ->get(route('admin.contact.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ContactPage')
            ->where('contact.whatsapp_number', '5491122334455'));

    $this->actingAs($user)
        ->get(route('admin.settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SettingsPage')
            ->where('settings.whatsapp_number', '5491122334455')
            ->where('settings.catalog_empty_text', 'Sin resultados'));

    $this->actingAs($user)
        ->get(route('admin.services.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ServicesAdminPage')
            ->has('items', 1)
            ->has('mediaItems', 1));
});

it('persists curated settings and syncs whatsapp contact', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $this->actingAs($user)
        ->post(route('admin.settings.save'), [
            'settings' => [
                'whatsapp_number' => '5491177788899',
                'reparaciones_url' => '/reparacion',
                'footer_address' => 'Merlo centro',
                'footer_hours' => 'Lun a Sab 9 a 20',
                'footer_map_url' => 'https://maps.example.com',
                'footer_cta_title' => 'Consulta stock',
                'footer_cta_text' => 'Te respondemos por WhatsApp.',
                'catalog_empty_text' => 'Nada por aca',
                'catalog_new_days' => '7',
                'catalog_product_image_rotation_ms' => '9000',
                'product_detail_description_word_limit' => '140',
            ],
        ])
        ->assertRedirect();

    expect(SiteGlobalConfig::value('whatsapp_number'))->toBe('5491177788899');
    expect(SiteGlobalConfig::value('catalog_product_image_rotation_ms'))->toBe('9000');
    expect(SiteContactConfig::query()->find(1)?->whatsapp_number)->toBe('5491177788899');
});

it('renders listings and trash pages with dedicated contracts', function (): void {
    $user = User::factory()->create(['role' => 'admin']);

    $category = Category::query()->create([
        'name' => 'Accesorios',
        'slug' => 'accesorios',
        'sort_order' => 1,
        'is_hidden' => false,
    ]);

    Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Cable HDMI',
        'slug' => 'cable-hdmi',
        'price' => 15000,
        'image_url' => '/assets/uploads/products/cable-hdmi.webp',
        'is_active' => true,
    ]);

    $trashedProduct = Product::query()->create([
        'category_id' => $category->id,
        'name' => 'Fuente PS2',
        'slug' => 'fuente-ps2',
        'price' => 10000,
        'is_active' => true,
    ]);
    $trashedProduct->delete();

    $trashedCategory = Category::query()->create([
        'name' => 'Legacy',
        'slug' => 'legacy',
        'sort_order' => 2,
        'is_hidden' => true,
    ]);
    $trashedCategory->delete();

    $this->actingAs($user)
        ->get(route('admin.listados.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListadosPage')
            ->has('rows', 1)
            ->has('categories', 1));

    $this->actingAs($user)
        ->get(route('admin.listados.print'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ListadosPrintPage')
            ->has('rows', 1));

    $this->actingAs($user)
        ->get(route('admin.trash.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/TrashPage')
            ->where('products.total', 1)
            ->has('categories', 1));
});
