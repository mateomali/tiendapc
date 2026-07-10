<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\SiteAnnouncement;
use App\Models\SiteAnnouncementConfig;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use App\Models\SiteService;
use App\Models\SiteServicesConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller
{
    public function announcements(): Response
    {
        $items = SiteAnnouncement::query()->orderBy('sort_order')->get();

        return Inertia::render('Admin/AnnouncementsPage', [
            'items' => $items->map(fn (SiteAnnouncement $announcement): array => [
                'id' => $announcement->id,
                'message' => $announcement->message,
                'link_url' => $announcement->link_url,
                'display_type' => $announcement->display_type,
                'image_url' => $announcement->image_url,
                'mobile_image_url' => $announcement->mobile_image_url,
                'sort_order' => $announcement->sort_order,
                'is_active' => $announcement->is_active,
                'starts_at' => optional($announcement->starts_at)->format('Y-m-d\TH:i'),
                'ends_at' => optional($announcement->ends_at)->format('Y-m-d\TH:i'),
                'status_label' => $this->scheduleStatusLabel($announcement),
            ]),
            'config' => [
                'rotation_ms' => SiteAnnouncementConfig::query()->firstOrCreate(['id' => 1], ['rotation_ms' => 4300])->rotation_ms,
                'catalog_product_image_rotation_ms' => max(2000, min(20000, (int) SiteGlobalConfig::value('catalog_product_image_rotation_ms', '10000'))),
            ],
            'mediaItems' => $this->serializeMediaItems(),
        ]);
    }

    public function saveAnnouncements(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rotation_ms' => ['required', 'integer', 'min:1000'],
            'catalog_product_image_rotation_ms' => ['required', 'integer', 'min:2000', 'max:20000'],
            'items' => ['required', 'array'],
            'items.*.id' => ['nullable', 'integer'],
            'items.*.message' => ['required', 'string', 'max:255'],
            'items.*.link_url' => ['nullable', 'string', 'max:500'],
            'items.*.display_type' => ['nullable', 'string', 'max:16'],
            'items.*.image_url' => ['nullable', 'string', 'max:500'],
            'items.*.mobile_image_url' => ['nullable', 'string', 'max:500'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:1'],
            'items.*.is_active' => ['nullable', 'boolean'],
            'items.*.starts_at' => ['nullable', 'date'],
            'items.*.ends_at' => ['nullable', 'date'],
        ]);

        SiteAnnouncementConfig::query()->updateOrCreate(['id' => 1], ['rotation_ms' => $validated['rotation_ms']]);
        SiteGlobalConfig::putValue('catalog_product_image_rotation_ms', (string) $validated['catalog_product_image_rotation_ms']);

        $ids = [];
        foreach ($validated['items'] as $index => $item) {
            $announcement = SiteAnnouncement::query()->updateOrCreate(
                ['id' => $item['id'] ?? $index + 1],
                [
                    'message' => $item['message'],
                    'link_url' => $item['link_url'] ?? '',
                    'display_type' => ($item['display_type'] ?? 'text') === 'image' ? 'image' : 'text',
                    'image_url' => $item['image_url'] ?? null,
                    'mobile_image_url' => $item['mobile_image_url'] ?? null,
                    'sort_order' => $item['sort_order'] ?? ($index + 1),
                    'is_active' => (bool) ($item['is_active'] ?? true),
                    'starts_at' => $item['starts_at'] ?? null,
                    'ends_at' => $item['ends_at'] ?? null,
                ],
            );
            $ids[] = $announcement->id;
        }

        SiteAnnouncement::query()->whereNotIn('id', $ids)->delete();

        return back()->with('success', 'Anuncios actualizados.');
    }

    public function contact(): Response
    {
        $contact = SiteContactConfig::query()->firstOrCreate(
            ['id' => 1],
            ['whatsapp_number' => config('tienda.whatsapp_number')],
        );

        return Inertia::render('Admin/ContactPage', [
            'contact' => [
                'whatsapp_number' => $contact->whatsapp_number,
                'contact_title' => $contact->contact_title,
                'contact_description' => $contact->contact_description,
                'contact_email' => $contact->contact_email,
                'maps_embed_url' => $contact->maps_embed_url,
                'whatsapp_display' => $this->formatWhatsappNumber($contact->whatsapp_number),
                'whatsapp_url' => $this->whatsappUrl($contact->whatsapp_number),
            ],
        ]);
    }

    public function saveContact(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'whatsapp_number' => ['required', 'string', 'max:20'],
            'contact_title' => ['nullable', 'string', 'max:120'],
            'contact_description' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email'],
            'maps_embed_url' => ['nullable', 'string', 'max:500'],
        ]);

        SiteContactConfig::query()->updateOrCreate(['id' => 1], $validated);
        SiteGlobalConfig::putValue('whatsapp_number', preg_replace('/\D+/', '', $validated['whatsapp_number']));

        return back()->with('success', 'Contacto actualizado.');
    }

    public function settings(): Response
    {
        $settings = $this->defaultSettings();

        return Inertia::render('Admin/SettingsPage', [
            'settings' => $settings,
            'whatsappDisplay' => $this->formatWhatsappNumber($settings['whatsapp_number']),
        ]);
    }

    public function saveSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.whatsapp_number' => ['required', 'string', 'max:20'],
            'settings.reparaciones_url' => ['nullable', 'string', 'max:500'],
            'settings.footer_address' => ['nullable', 'string', 'max:255'],
            'settings.footer_hours' => ['nullable', 'string', 'max:255'],
            'settings.footer_map_url' => ['nullable', 'string', 'max:500'],
            'settings.footer_cta_title' => ['nullable', 'string', 'max:255'],
            'settings.footer_cta_text' => ['nullable', 'string'],
            'settings.catalog_empty_text' => ['nullable', 'string'],
            'settings.catalog_new_days' => ['nullable', 'integer', 'min:1', 'max:90'],
            'settings.catalog_product_image_rotation_ms' => ['nullable', 'integer', 'min:2000', 'max:20000'],
            'settings.product_detail_description_word_limit' => ['nullable', 'integer', 'min:40', 'max:1000'],
            'settings.repair_cash_discount_enabled' => ['nullable', 'boolean'],
            'settings.repair_cash_discount_threshold' => ['nullable', 'integer', 'min:0', 'max:999999999'],
            'settings.repair_cash_discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'settings.repair_cash_discount_note' => ['nullable', 'string', 'max:255'],
        ]);

        $settings = $validated['settings'];
        foreach ($settings as $key => $value) {
            SiteGlobalConfig::putValue((string) $key, is_scalar($value) ? (string) $value : json_encode($value));
        }

        SiteContactConfig::query()->updateOrCreate(['id' => 1], [
            'whatsapp_number' => $settings['whatsapp_number'],
        ]);

        return back()->with('success', 'Configuracion guardada.');
    }

    public function clearCache(): RedirectResponse
    {
        Artisan::call('optimize:clear');
        SiteGlobalConfig::putValue('assets_version', now()->format('YmdHis'));

        return back()->with('success', 'Cache limpiada.');
    }

    public function services(): Response
    {
        return Inertia::render('Admin/ServicesAdminPage', [
            'config' => SiteServicesConfig::query()->firstOrCreate(['id' => 1]),
            'items' => SiteService::query()->orderBy('sort_order')->get(),
            'mediaItems' => $this->serializeMediaItems(),
        ]);
    }

    public function saveServices(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'config' => ['required', 'array'],
            'items' => ['required', 'array'],
            'items.*.title' => ['required', 'string', 'max:150'],
            'items.*.subtitle' => ['nullable', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.points_text' => ['nullable', 'string'],
            'items.*.image_url' => ['nullable', 'string', 'max:500'],
            'items.*.sort_order' => ['nullable', 'integer', 'min:1'],
            'items.*.is_active' => ['nullable', 'boolean'],
        ]);

        SiteServicesConfig::query()->updateOrCreate(['id' => 1], $validated['config']);
        SiteService::query()->delete();

        foreach ($validated['items'] as $index => $item) {
            SiteService::query()->create([
                'title' => $item['title'],
                'subtitle' => $item['subtitle'] ?? null,
                'description' => $item['description'] ?? null,
                'points_text' => $item['points_text'] ?? null,
                'image_url' => $item['image_url'] ?? null,
                'sort_order' => $item['sort_order'] ?? ($index + 1),
                'is_active' => (bool) ($item['is_active'] ?? true),
            ]);
        }

        return back()->with('success', 'Servicios actualizados.');
    }

    public function listados(Request $request): Response
    {
        $filters = $this->listingFilters($request);

        return Inertia::render('Admin/ListadosPage', [
            'filters' => $filters,
            'categories' => Category::query()
                ->where('is_hidden', false)
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'productCount' => $category->products()->where('is_active', true)->count(),
                ]),
            'rows' => $this->buildListingRows($filters, true),
            'urls' => [
                'index' => route('admin.listados.index'),
                'print' => route('admin.listados.print'),
                'thumbBase' => route('admin.listados.thumb'),
            ],
        ]);
    }

    public function listadosPrint(Request $request): Response
    {
        $filters = $this->listingFilters($request);

        return Inertia::render('Admin/ListadosPrintPage', [
            'filters' => $filters,
            'rows' => $this->buildListingRows($filters, false),
            'urls' => [
                'index' => route('admin.listados.index'),
                'thumbBase' => route('admin.listados.thumb'),
            ],
            'autoPrint' => $this->truthy($request->query('print', false)),
        ]);
    }

    public function listadosThumb(Request $request): HttpResponse
    {
        $source = $this->normalizeThumbSource((string) $request->query('src', ''), $request);
        if ($source === null || ! $this->isAllowedThumbUrl($source, $request)) {
            return $this->placeholderThumbResponse();
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 8,
                'ignore_errors' => true,
                'header' => "Accept: image/*\r\nUser-Agent: TiendaAbril-Thumb/1.0\r\n",
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $data = @file_get_contents($source, false, $context);
        $headers = isset($http_response_header) && is_array($http_response_header) ? $http_response_header : [];
        $statusCode = $this->extractHttpStatusCode($headers);
        $contentType = $this->extractContentType($headers);

        if ($data === false || $data === '' || $statusCode < 200 || $statusCode >= 300 || ! str_starts_with($contentType, 'image/')) {
            return $this->placeholderThumbResponse();
        }

        return response($data, 200)->header('Content-Type', $contentType)->header('Cache-Control', 'private, max-age=900');
    }

    public function trash(Request $request): Response
    {
        $page = max(1, (int) $request->query('page', 1));
        $products = Product::onlyTrashed()
            ->with('category')
            ->orderByDesc('deleted_at')
            ->paginate(20, ['*'], 'page', $page)
            ->withQueryString();

        return Inertia::render('Admin/TrashPage', [
            'products' => [
                'total' => $products->total(),
                'page' => $products->currentPage(),
                'totalPages' => $products->lastPage(),
                'items' => collect($products->items())->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'categoryName' => (string) ($product->category?->name ?? 'Sin categoria'),
                    'deletedAt' => optional($product->deleted_at)->format('Y-m-d H:i') ?? '-',
                    'restoreAction' => route('admin.trash.product.restore', $product->id),
                    'deleteAction' => route('admin.trash.product.delete', $product->id),
                ]),
            ],
            'categories' => Category::onlyTrashed()
                ->orderByDesc('deleted_at')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'productCount' => Product::withTrashed()->where('category_id', $category->id)->count(),
                    'deletedAt' => optional($category->deleted_at)->format('Y-m-d H:i') ?? '-',
                    'restoreAction' => route('admin.trash.category.restore', $category->id),
                    'deleteAction' => route('admin.trash.category.delete', $category->id),
                ]),
        ]);
    }

    public function restoreProduct(int $id): RedirectResponse
    {
        Product::onlyTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Producto restaurado.');
    }

    public function forceDeleteProduct(int $id): RedirectResponse
    {
        Product::onlyTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Producto eliminado definitivamente.');
    }

    public function restoreCategory(int $id): RedirectResponse
    {
        Category::onlyTrashed()->findOrFail($id)->restore();

        return back()->with('success', 'Categoria restaurada.');
    }

    public function forceDeleteCategory(int $id): RedirectResponse
    {
        Category::onlyTrashed()->findOrFail($id)->forceDelete();

        return back()->with('success', 'Categoria eliminada definitivamente.');
    }

    private function defaultSettings(): array
    {
        return [
            'whatsapp_number' => SiteGlobalConfig::value('whatsapp_number', SiteContactConfig::query()->find(1)?->whatsapp_number ?? config('tienda.whatsapp_number')),
            'reparaciones_url' => SiteGlobalConfig::value('reparaciones_url', route('repairs.tracking')),
            'footer_address' => SiteGlobalConfig::value('footer_address', 'Merlo, Buenos Aires'),
            'footer_hours' => SiteGlobalConfig::value('footer_hours', 'Lunes a viernes de 10:30 a 13:30 y 17:00 a 20:30 | Sábados 17:00 a 20:30'),
            'footer_map_url' => SiteGlobalConfig::value('footer_map_url', ''),
            'footer_cta_title' => SiteGlobalConfig::value('footer_cta_title', 'Hablemos'),
            'footer_cta_text' => SiteGlobalConfig::value('footer_cta_text', 'Escribinos por WhatsApp para consultar stock, reparaciones y presupuestos.'),
            'catalog_empty_text' => SiteGlobalConfig::value('catalog_empty_text', 'Prueba con otra categoria o con un termino distinto.'),
            'catalog_new_days' => SiteGlobalConfig::value('catalog_new_days', '10'),
            'catalog_product_image_rotation_ms' => SiteGlobalConfig::value('catalog_product_image_rotation_ms', '10000'),
            'product_detail_description_word_limit' => SiteGlobalConfig::value('product_detail_description_word_limit', '100'),
            'repair_cash_discount_enabled' => SiteGlobalConfig::value('repair_cash_discount_enabled', '1'),
            'repair_cash_discount_threshold' => SiteGlobalConfig::value('repair_cash_discount_threshold', '30000'),
            'repair_cash_discount_percentage' => SiteGlobalConfig::value('repair_cash_discount_percentage', '10'),
            'repair_cash_discount_note' => SiteGlobalConfig::value('repair_cash_discount_note', 'Abonando en efectivo tenes 10% de descuento.'),
        ];
    }

    private function scheduleStatusLabel(SiteAnnouncement $announcement): string
    {
        if (! $announcement->is_active) {
            return 'inactivo';
        }

        if ($announcement->starts_at !== null && $announcement->starts_at->isFuture()) {
            return 'programado';
        }

        if ($announcement->ends_at !== null && $announcement->ends_at->isPast()) {
            return 'vencido';
        }

        return 'activo';
    }

    private function serializeMediaItems(): array
    {
        return MediaAsset::query()
            ->latest()
            ->limit(60)
            ->get()
            ->map(fn (MediaAsset $media): array => [
                'id' => $media->id,
                'title' => $media->title,
                'tags' => $media->tags,
                'fileUrl' => $media->file_url,
                'width' => $media->width,
                'height' => $media->height,
            ])
            ->all();
    }

    private function listingFilters(Request $request): array
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string'],
            'todas' => ['nullable'],
            'categorias' => ['nullable'],
            'excluir' => ['nullable'],
            'ofertas' => ['nullable'],
            'destacados' => ['nullable'],
            'print' => ['nullable'],
        ]);

        return [
            'query' => trim((string) ($validated['q'] ?? '')),
            'includeAllCategories' => $this->truthy($validated['todas'] ?? false),
            'selectedCategoryIds' => array_values(array_unique(array_map('intval', (array) ($validated['categorias'] ?? [])))),
            'excludedProductIds' => array_values(array_unique(array_map('intval', (array) ($validated['excluir'] ?? [])))),
            'onlyOffers' => $this->truthy($validated['ofertas'] ?? false),
            'onlyFeatured' => $this->truthy($validated['destacados'] ?? false),
        ];
    }

    private function buildListingRows(array $filters, bool $includeAllCategories): array
    {
        $query = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->when(! $includeAllCategories && ! $filters['includeAllCategories'], function ($productsQuery): void {
                $productsQuery->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('is_hidden', false));
            })
            ->when($filters['query'] !== '', function ($productsQuery) use ($filters): void {
                $search = '%' . $filters['query'] . '%';
                $productsQuery->where(function ($subQuery) use ($search): void {
                    $subQuery
                        ->where('name', 'like', $search)
                        ->orWhere('sku', 'like', $search);
                });
            })
            ->when($filters['selectedCategoryIds'] !== [], fn ($productsQuery) => $productsQuery->whereIn('category_id', $filters['selectedCategoryIds']))
            ->when($filters['excludedProductIds'] !== [], fn ($productsQuery) => $productsQuery->whereNotIn('id', $filters['excludedProductIds']))
            ->when($filters['onlyFeatured'], fn ($productsQuery) => $productsQuery->where('is_featured', true))
            ->when($filters['onlyOffers'], function ($productsQuery): void {
                $productsQuery
                    ->whereNotNull('offer_price')
                    ->where('offer_price', '>', 0)
                    ->whereColumn('offer_price', '<', 'price');
            })
            ->orderBy('category_id')
            ->orderByDesc('is_featured')
            ->orderBy('name');

        return $query->get()->map(fn (Product $product): array => [
            'id' => $product->id,
            'categoryId' => (int) $product->category_id,
            'name' => $product->name,
            'categoryName' => (string) ($product->category?->name ?? ''),
            'imageUrl' => $this->normalizeMediaUrl($product->image_url),
            'price' => $product->effectivePrice(),
            'priceLabel' => number_format($product->effectivePrice(), 0, ',', '.'),
            'hasOffer' => $product->offerIsActive(),
            'isFeatured' => (bool) $product->is_featured,
        ])->all();
    }

    private function truthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on', 'si'], true);
    }

    private function normalizeMediaUrl(?string $value): ?string
    {
        $path = trim((string) $value);
        if ($path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/')) {
            return $path;
        }

        return '/' . ltrim($path, '/');
    }

    private function whatsappUrl(?string $number): string
    {
        return 'https://wa.me/' . preg_replace('/\D+/', '', (string) $number);
    }

    private function formatWhatsappNumber(?string $number): string
    {
        $digits = preg_replace('/\D+/', '', (string) $number);

        if (strlen($digits) <= 4) {
            return $digits;
        }

        return '+' . substr($digits, 0, 2) . ' ' . substr($digits, 2);
    }

    private function normalizeThumbSource(string $value, Request $request): ?string
    {
        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, '//')) {
            return $request->getScheme() . ':' . $value;
        }

        if (str_starts_with($value, '/')) {
            return $request->getSchemeAndHttpHost() . $value;
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    private function isAllowedThumbUrl(string $url, Request $request): bool
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if ($host === '') {
            return false;
        }

        $currentHost = strtolower((string) preg_replace('/:\d+$/', '', (string) $request->getHost()));
        if ($currentHost !== '' && $host === $currentHost) {
            return true;
        }

        if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
            return false;
        }

        return true;
    }

    private function extractHttpStatusCode(array $headers): int
    {
        foreach ($headers as $headerLine) {
            if (preg_match('/^HTTP\/\d+\.\d+\s+(\d{3})/i', (string) $headerLine, $matches) === 1) {
                return (int) ($matches[1] ?? 0);
            }
        }

        return 0;
    }

    private function extractContentType(array $headers): string
    {
        foreach ($headers as $headerLine) {
            if (stripos((string) $headerLine, 'Content-Type:') !== 0) {
                continue;
            }

            $raw = trim((string) substr((string) $headerLine, strlen('Content-Type:')));
            $parts = explode(';', $raw);
            $type = strtolower(trim((string) ($parts[0] ?? '')));
            if ($type !== '') {
                return $type;
            }
        }

        return '';
    }

    private function placeholderThumbResponse(): HttpResponse
    {
        $placeholderPath = public_path('assets/img/logo-placeholder.svg');
        if (is_file($placeholderPath)) {
            return response(File::get($placeholderPath), 200)->header('Content-Type', 'image/svg+xml; charset=utf-8');
        }

        return response('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#f0f4fa"/><text x="90" y="95" text-anchor="middle" font-size="18" fill="#5b6f91">IMG</text></svg>', 200)
            ->header('Content-Type', 'image/svg+xml; charset=utf-8');
    }
}
