<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\SiteAnnouncement;
use App\Models\SiteContactConfig;
use App\Models\SiteService;
use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\RepairOrder;
use App\Models\Sale;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $backupsDirectory = public_path(config('tienda.uploads.backups'));

        return Inertia::render('Admin/DashboardPage', [
            'stats' => [
                'products' => Product::query()->count(),
                'categories' => Category::query()->count(),
                'sales' => Sale::query()->count(),
                'repair_active' => RepairOrder::query()->where('entregado', 'no')->count(),
                'media' => MediaAsset::query()->count(),
                'announcements' => SiteAnnouncement::query()->count(),
                'services' => SiteService::query()->count(),
                'backups' => File::isDirectory($backupsDirectory) ? count(File::files($backupsDirectory)) : 0,
            ],
            'recentSales' => Sale::query()->latest('issued_at')->limit(5)->get()->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'ticket_number_display' => $sale->ticketNumberDisplay(),
                'customer_label' => $sale->customer_label,
                'total' => $sale->total,
                'issued_at' => optional($sale->issued_at)->format('Y-m-d H:i'),
            ]),
            'contact' => [
                'whatsapp_number' => SiteContactConfig::query()->find(1)?->whatsapp_number,
            ],
            'urls' => [
                'products' => route('admin.products.index'),
                'missingImages' => route('admin.products.missing_images', ['missing' => 'images']),
                'missingSku' => route('admin.products.missing_sku', ['missing' => 'sku']),
                'categories' => route('admin.categories.index'),
                'sales' => route('admin.sales.index'),
                'media' => route('admin.media.index'),
                'backups' => route('admin.backups.index'),
                'announcements' => route('admin.announcements.index'),
                'services' => route('admin.services.index'),
                'settings' => route('admin.settings.index'),
                'contact' => route('admin.contact.index'),
                'repairs' => route('repairs.workbench'),
            ],
        ]);
    }
}
