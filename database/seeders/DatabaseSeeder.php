<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\RepairOrder;
use App\Models\SiteAnnouncement;
use App\Models\SiteAnnouncementConfig;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use App\Models\SiteService;
use App\Models\SiteServicesConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        SiteAnnouncementConfig::query()->firstOrCreate(['id' => 1], ['rotation_ms' => 4300]);
        SiteContactConfig::query()->firstOrCreate(['id' => 1], [
            'whatsapp_number' => config('tienda.whatsapp_number'),
            'contact_title' => 'Contactanos',
            'contact_description' => 'Escribinos por WhatsApp para consultar stock y reparaciones.',
        ]);
        SiteServicesConfig::query()->firstOrCreate(['id' => 1], [
            'hero_eyebrow' => 'SERVICIOS',
            'hero_title' => 'Servicios de tienda y taller',
            'cta_title' => 'Hablemos',
        ]);
        SiteGlobalConfig::putValue('whatsapp_number', config('tienda.whatsapp_number'));
        SiteGlobalConfig::putValue('footer_address', 'Av. Jose de San Martin 2658, Parque San Martin, Merlo');
        SiteGlobalConfig::putValue('footer_hours', 'Lunes a viernes de 10:30 a 13:30 y 17:00 a 20:30 | Sábados 17:00 a 20:30');
        SiteGlobalConfig::putValue('footer_map_url', 'https://maps.google.com/maps?q=sudoku%20merlo&t=m&z=13&output=embed&iwloc=near');
        SiteGlobalConfig::putValue('footer_cta_title', 'Queres consultar algo?');
        SiteGlobalConfig::putValue('footer_cta_text', 'Escribinos por WhatsApp:');
        SiteGlobalConfig::putValue('product_cash_discount_enabled', '1');
        SiteGlobalConfig::putValue('product_cash_discount_threshold', '20000');
        SiteGlobalConfig::putValue('product_cash_discount_percentage', '10');
        SiteGlobalConfig::putValue('product_cash_discount_note', 'Oferta en efectivo al retirar en el local.');

        if (! User::query()->exists()) {
            User::query()->create([
                'name' => 'Administrador',
                'email' => 'admin@tienda.local',
                'password' => Hash::make('admin12345'),
                'role' => 'admin',
            ]);
        }

        if (! Category::query()->exists()) {
            $category = Category::query()->create([
                'name' => 'Cables, cargadores, fuentes',
                'slug' => 'cables-cargadores-fuentes',
                'description' => 'Accesorios y cables para consolas y celulares.',
                'image_url' => '/assets/img/logo-placeholder.svg',
                'group_key' => 'accesorios',
                'sort_order' => 1,
                'is_hidden' => false,
            ]);

            Product::query()->create([
                'category_id' => $category->id,
                'name' => 'Cable de carga para joystick PS4',
                'slug' => 'cable-carga-joystick-ps4',
                'sku' => 'PS4-CABLE-01',
                'short_description' => 'Cable USB de carga rapida para DualShock 4.',
                'description' => 'Cable de carga reforzado para joystick PS4 con conector micro USB.',
                'price' => 4000,
                'offer_price' => 3500,
                'offer_start_at' => now()->subDay(),
                'stock' => 8,
                'stock_status' => 'instock',
                'image_url' => '/assets/img/logo-placeholder.svg',
                'is_featured' => true,
                'is_active' => true,
            ]);
        }

        if (! SiteAnnouncement::query()->exists()) {
            SiteAnnouncement::query()->create([
                'message' => 'Contacta con nosotros por WhatsApp',
                'link_url' => '/servicios',
                'display_type' => 'text',
                'sort_order' => 1,
                'is_active' => true,
            ]);
        }

        if (! SiteService::query()->exists()) {
            SiteService::query()->create([
                'title' => 'Reparacion de celulares',
                'subtitle' => 'Diagnostico y cambio de modulos',
                'description' => 'Servicio tecnico para celulares, consolas y accesorios.',
                'points_text' => "Diagnostico\nGarantia\nAtencion rapida",
                'image_url' => '/assets/img/logo-placeholder.svg',
                'sort_order' => 1,
                'is_active' => true,
            ]);
        }

        if (! RepairOrder::query()->exists()) {
            $repairsDirectory = public_path((string) config('tienda.uploads.repairs'));
            $thumbnailsDirectory = public_path((string) config('tienda.uploads.repairs_thumbnails'));
            $seedImage = 'seed_repair_demo.png';
            $sourceImage = public_path('assets/img/repair-banner-legacy.png');

            File::ensureDirectoryExists($repairsDirectory);
            File::ensureDirectoryExists($thumbnailsDirectory);

            if (File::exists($sourceImage)) {
                File::copy($sourceImage, $repairsDirectory . DIRECTORY_SEPARATOR . $seedImage);
                File::copy($sourceImage, $thumbnailsDirectory . DIRECTORY_SEPARATOR . 'thumb_' . $seedImage);
            }

            RepairOrder::query()->create([
                'id' => 1,
                'reparacion' => 1,
                'fecha' => now()->toDateString(),
                'nombre_cliente' => 'Cliente Publico',
                'dni' => 22333444,
                'contacto' => '1133445566',
                'modelo' => 'PlayStation 4',
                'descripcion' => 'No enciende',
                'observaciones' => 'Pendiente de diagnostico',
                'monto' => 0,
                'senia' => 0,
                'estado' => 'PENDIENTE',
                'entregado' => 'no',
                'imagen' => $seedImage,
                'categorias_reparacion' => 2,
            ]);
        }
    }
}
