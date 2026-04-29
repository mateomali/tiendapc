<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\SiteAnnouncement;
use App\Models\SiteAnnouncementConfig;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use App\Models\SiteService;
use App\Models\SiteServicesConfig;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class StoreController extends Controller
{
    public function home(): RedirectResponse
    {
        return redirect()->route('store.catalog');
    }

    public function catalog(Request $request, CartService $cartService): Response
    {
        $filters = $this->catalogFilters($request);
        $newDays = max(1, (int) SiteGlobalConfig::value('catalog_new_days', '10'));
        $newSince = now()->subDays($newDays);

        $query = Product::query()
            ->select([
                'id',
                'category_id',
                'name',
                'slug',
                'sku',
                'short_description',
                'price',
                'offer_price',
                'offer_start_at',
                'offer_end_at',
                'image_url',
                'image_url_2',
                'image_url_3',
                'is_featured',
                'created_at',
            ])
            ->with('category')
            ->sellable()
            ->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('is_hidden', false));

        if ($filters['selectedCategory'] !== '') {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('slug', $filters['selectedCategory']));
        }

        if ($filters['selectedGroup'] !== '') {
            $query->whereHas('category', fn ($categoryQuery) => $categoryQuery->where('group_key', $filters['selectedGroup']));
        }

        if ($filters['query'] !== '') {
            $search = '%' . trim($filters['query']) . '%';
            $query->where(function ($searchQuery) use ($search): void {
                $searchQuery
                    ->where('name', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhere('description', 'like', $search)
                    ->orWhere('short_description', 'like', $search)
                    ->orWhere('sku', 'like', $search);
            });
        }

        if ($filters['onlyNew']) {
            $query->where('created_at', '>=', $newSince);
        }

        if ($filters['onlyOffers']) {
            $query
                ->whereNotNull('offer_price')
                ->where('offer_price', '>', 0)
                ->whereColumn('offer_price', '<', 'price')
                ->where(function ($offerQuery): void {
                    $offerQuery
                        ->whereNull('offer_start_at')
                        ->orWhere('offer_start_at', '<=', now());
                })
                ->where(function ($offerQuery): void {
                    $offerQuery
                        ->whereNull('offer_end_at')
                        ->orWhere('offer_end_at', '>=', now());
                });
        }

        if ($filters['onlyFeatured']) {
            $query->where('is_featured', true);
        }

        match ($filters['order']) {
            'precio_asc' => $query->orderByRaw('COALESCE(NULLIF(offer_price, 0), price) ASC')->orderByDesc('is_featured')->orderByDesc('created_at')->orderByDesc('id'),
            'precio_desc' => $query->orderByRaw('COALESCE(NULLIF(offer_price, 0), price) DESC')->orderByDesc('is_featured')->orderByDesc('created_at')->orderByDesc('id'),
            default => $query->orderByDesc('is_featured')->orderByDesc('created_at')->orderByDesc('id'),
        };

        $categories = Category::query()
            ->where('is_hidden', false)
            ->withCount([
                'products as sellable_products_count' => fn ($productsQuery) => $productsQuery->sellable(),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $cartQuantities = collect($cartService->items())
            ->mapWithKeys(static fn (array $item): array => [(int) $item['product_id'] => (int) $item['quantity']]);

        $products = $query->get();

        return Inertia::render('Store/CatalogPage', [
            'kind' => 'catalog',
            'headerSearch' => [
                'query' => $filters['query'],
                'group' => $filters['selectedGroup'],
                'order' => $filters['order'],
                'onlyNew' => $filters['onlyNew'],
                'onlyOffers' => $filters['onlyOffers'],
                'onlyFeatured' => $filters['onlyFeatured'],
                'showDesktop' => true,
                'showMobileSticky' => true,
            ],
            'filters' => [
                'query' => $filters['query'],
                'selectedCategory' => $filters['selectedCategory'],
                'selectedGroup' => $filters['selectedGroup'],
                'order' => $filters['order'],
                'onlyNew' => $filters['onlyNew'],
                'onlyOffers' => $filters['onlyOffers'],
                'onlyFeatured' => $filters['onlyFeatured'],
                'clearUrl' => route('store.catalog'),
                'emptyText' => SiteGlobalConfig::value('catalog_empty_text', 'Prueba con otra categoria o con un termino distinto.'),
                'imageRotationMs' => max(2000, min(20000, (int) SiteGlobalConfig::value('catalog_product_image_rotation_ms', '10000'))),
            ],
            'announcements' => [
                'rotationMs' => SiteAnnouncementConfig::query()->find(1)?->rotation_ms ?? 4300,
                'items' => SiteAnnouncement::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn (SiteAnnouncement $announcement): array => $this->serializeAnnouncement($announcement))
                    ->values(),
            ],
            'groups' => $this->serializeGroups($categories, $filters['selectedGroup'], $filters['selectedCategory'], $filters['query'], $filters['order'], $filters['onlyNew'], $filters['onlyOffers'], $filters['onlyFeatured']),
            'categories' => $this->serializeCategories($categories, $filters, $products),
            'products' => $products
                ->map(fn (Product $product): array => $this->serializeCatalogProduct($product, (int) ($cartQuantities->get($product->id) ?? 0), $newSince))
                ->values(),
            'summary' => [
                'productCount' => $products->count(),
            ],
        ]);
    }

    public function show(string $slug, CartService $cartService): Response
    {
        /** @var Product $product */
        $product = Product::query()
            ->with('category')
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Product::query()
            ->with('category')
            ->sellable()
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->limit(4)
            ->get();

        $cartQuantities = collect($cartService->items())
            ->mapWithKeys(static fn (array $item): array => [(int) $item['product_id'] => (int) $item['quantity']]);

        $cartMatch = collect($cartService->items())->firstWhere('product_id', $product->id);
        $cartQty = is_array($cartMatch) ? (int) ($cartMatch['quantity'] ?? 0) : 0;

        $newDays = max(1, (int) SiteGlobalConfig::value('catalog_new_days', '10'));
        $newSince = now()->subDays($newDays);

        return Inertia::render('Store/ProductPage', [
            'kind' => 'product-detail',
            'headerSearch' => [
                'query' => '',
                'group' => '',
                'order' => 'fecha_ingreso',
                'onlyNew' => false,
                'onlyOffers' => false,
                'showDesktop' => true,
                'showMobileSticky' => true,
            ],
            'announcements' => [
                'rotationMs' => SiteAnnouncementConfig::query()->find(1)?->rotation_ms ?? 4300,
                'items' => SiteAnnouncement::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn (SiteAnnouncement $announcement): array => $this->serializeAnnouncement($announcement))
                    ->values(),
            ],
            'product' => $this->serializeDetailProduct($product, $cartQty, $newSince),
            'relatedImageRotationMs' => max(2000, min(20000, (int) SiteGlobalConfig::value('catalog_product_image_rotation_ms', '10000'))),
            'relatedProducts' => $related
                ->map(fn (Product $relatedProduct): array => $this->serializeCatalogProduct($relatedProduct, (int) ($cartQuantities->get($relatedProduct->id) ?? 0), $newSince))
                ->values(),
        ]);
    }

    public function services(): Response
    {
        $config = SiteServicesConfig::query()->find(1);

        return Inertia::render('Store/ServicesPage', [
            'kind' => 'services',
            'hero' => [
                'eyebrow' => (string) ($config?->hero_eyebrow ?: 'SERVICIOS'),
                'title' => (string) ($config?->hero_title ?: 'Soluciones tecnicas para PC, celulares y consolas'),
                'description' => (string) ($config?->hero_description ?: 'Brindamos servicio tecnico con atencion personalizada, diagnostico real y trabajos pensados para devolver rendimiento y confianza a tus equipos.'),
            ],
            'services' => SiteService::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(function (SiteService $service, int $index): array {
                    $points = preg_split('/\R+/', (string) ($service->points_text ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [];

                    return [
                        'indexLabel' => 'SERVICIO ' . ($index + 1),
                        'title' => $service->title,
                        'subtitle' => $service->subtitle,
                        'description' => $service->description,
                        'points' => array_values(array_map('trim', $points)),
                        'imageUrl' => $this->normalizeMediaUrl($service->image_url) ?: asset('assets/img/logo-placeholder.svg'),
                        'imageFallbackUrl' => asset('assets/img/logo-placeholder.svg'),
                    ];
                })
                ->values(),
            'cta' => [
                'title' => (string) ($config?->cta_title ?: 'Necesitas ayuda con un equipo?'),
                'description' => (string) ($config?->cta_description ?: 'Contanos tu caso por WhatsApp y te asesoramos rapido sobre la mejor alternativa de reparacion.'),
                'whatsappText' => (string) ($config?->cta_whatsapp_text ?: 'CONSULTAR POR WHATSAPP'),
                'repairText' => (string) ($config?->cta_repair_text ?: 'VER REPARACIONES'),
                'whatsappUrl' => $this->buildWhatsappUrl('Hola Sudoku, quiero hacer una consulta por servicios tecnicos.'),
                'repairUrl' => $this->safeRouteConfigValue('reparaciones_url', url('/reparaciones.php')),
            ],
        ]);
    }

    public function cart(CartService $cartService): Response
    {
        $items = collect($cartService->items())->map(function (array $item): array {
            return [
                'productId' => (int) $item['product_id'],
                'name' => (string) $item['name'],
                'slug' => (string) $item['slug'],
                'imageUrl' => (string) ($item['image_url'] ?: asset('assets/img/logo-placeholder.svg')),
                'imageFallbackUrl' => asset('assets/img/logo-placeholder.svg'),
                'qty' => (int) $item['quantity'],
                'basePrice' => (int) $item['unit_price'],
                'basePriceLabel' => $this->money((int) $item['unit_price']),
                'unitPrice' => (int) $item['unit_price'],
                'unitPriceLabel' => $this->money((int) $item['unit_price']),
                'subtotal' => (int) $item['subtotal'],
                'subtotalLabel' => $this->money((int) $item['subtotal']),
                'hasOffer' => false,
                'updateAction' => route('cart.update'),
                'removeAction' => route('cart.remove'),
            ];
        })->values();

        $total = $cartService->total();

        return Inertia::render('Store/CartPage', [
            'kind' => 'cart',
            'headerSearch' => [
                'query' => '',
                'group' => '',
                'order' => 'fecha_ingreso',
                'onlyNew' => false,
                'onlyOffers' => false,
                'onlyFeatured' => false,
                'showDesktop' => true,
                'showMobileSticky' => true,
            ],
            'items' => $items,
            'totalItems' => $items->sum('qty'),
            'total' => $total,
            'totalLabel' => $this->money($total),
            'clearAction' => route('cart.clear'),
            'continueShoppingUrl' => route('store.catalog'),
            'checkoutWhatsappUrl' => $this->buildCartWhatsappUrl($items, $total),
        ]);
    }

    /**
     * @return array{query: string, selectedCategory: string, selectedGroup: string, order: string, onlyNew: bool, onlyOffers: bool, onlyFeatured: bool}
     */
    private function catalogFilters(Request $request): array
    {
        $selectedCategory = trim((string) ($request->query('categoria', $request->query('category', ''))));
        $selectedGroup = strtolower(trim((string) $request->query('grupo', '')));
        $query = trim((string) $request->query('q', ''));
        $order = trim((string) $request->query('orden', $request->query('order', 'fecha_ingreso')));

        return [
            'query' => $query,
            'selectedCategory' => $selectedCategory,
            'selectedGroup' => $selectedGroup,
            'order' => in_array($order, ['fecha_ingreso', 'precio_asc', 'precio_desc'], true) ? $order : 'fecha_ingreso',
            'onlyNew' => $this->truthy($request->query('novedades', $request->query('only_new', false))),
            'onlyOffers' => $this->truthy($request->query('ofertas', $request->query('only_offers', false))),
            'onlyFeatured' => $this->truthy($request->query('destacados', $request->query('only_featured', false))),
        ];
    }

    /**
     * @param Collection<int, Category> $categories
     * @param array{query: string, selectedCategory: string, selectedGroup: string, order: string, onlyNew: bool, onlyOffers: bool, onlyFeatured: bool} $filters
     * @param Collection<int, Product> $products
     * @return array<int, array{id: int, name: string, slug: string, groupKey: string, productCount: int, url: string, isSelected: bool}>
     */
    private function serializeCategories(Collection $categories, array $filters, Collection $products): array
    {
        $productCountsByCategory = $products->countBy('category_id');

        return $categories
            ->map(function (Category $category) use ($filters, $productCountsByCategory): array {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'groupKey' => (string) $category->group_key,
                    'productCount' => (int) ($productCountsByCategory->get($category->id) ?? 0),
                    'url' => route('store.catalog', $this->catalogQuery([
                        'categoria' => $category->slug,
                    ], $filters)),
                    'isSelected' => $filters['selectedCategory'] === $category->slug,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, Category> $categories
     * @return array<int, array{
     *   key: string,
     *   label: string,
     *   productCount: int,
     *   url: string,
     *   isSelected: bool,
     *   isOpenByDefault: bool,
     *   categories: array<int, array{slug: string, name: string, groupKey: string, productCount: int, url: string, isSelected: bool}>
     * }>
     */
    private function serializeGroups(Collection $categories, string $selectedGroup, string $selectedCategory, string $query, string $order, bool $onlyNew, bool $onlyOffers, bool $onlyFeatured): array
    {
        $labels = $this->groupLabels();
        $grouped = $categories
            ->groupBy(static fn (Category $category): string => (string) $category->group_key)
            ->filter(static fn (Collection $groupCategories, string $key): bool => $key !== '');

        $selectedCategoryModel = $categories->firstWhere('slug', $selectedCategory);
        $selectedCategoryGroup = $selectedCategoryModel instanceof Category ? (string) $selectedCategoryModel->group_key : '';
        $defaultOpenKey = $selectedGroup !== ''
            ? $selectedGroup
            : ($selectedCategoryGroup !== '' ? $selectedCategoryGroup : (string) $grouped->keys()->first());

        return $grouped
            ->map(function (Collection $groupCategories, string $key) use ($labels, $selectedGroup, $selectedCategory, $query, $order, $onlyNew, $onlyOffers, $onlyFeatured, $defaultOpenKey): array {
                $sortedCategories = $groupCategories
                    ->sortBy([
                        ['sort_order', 'asc'],
                        ['name', 'asc'],
                    ])
                    ->values();

                $categoriesPayload = $sortedCategories
                    ->map(function (Category $category) use ($selectedCategory, $query, $order, $onlyNew, $onlyOffers, $onlyFeatured): array {
                        return [
                            'slug' => $category->slug,
                            'name' => $category->name,
                            'groupKey' => (string) $category->group_key,
                            'productCount' => (int) ($category->sellable_products_count ?? 0),
                            'url' => route('store.catalog', array_filter([
                                'categoria' => $category->slug,
                                'grupo' => (string) $category->group_key,
                                'q' => $query !== '' ? $query : null,
                                'orden' => $order !== 'fecha_ingreso' ? $order : null,
                                'novedades' => $onlyNew ? 1 : null,
                                'ofertas' => $onlyOffers ? 1 : null,
                                'destacados' => $onlyFeatured ? 1 : null,
                            ], static fn ($value) => $value !== null && $value !== '')),
                            'isSelected' => $selectedCategory === $category->slug,
                        ];
                    })
                    ->all();

                return [
                    'key' => $key,
                    'label' => $labels[$key] ?? strtoupper($key),
                    'productCount' => array_sum(array_map(static fn (array $category): int => (int) $category['productCount'], $categoriesPayload)),
                    'url' => route('store.catalog', array_filter([
                        'grupo' => $key,
                        'q' => $query !== '' ? $query : null,
                        'orden' => $order !== 'fecha_ingreso' ? $order : null,
                        'novedades' => $onlyNew ? 1 : null,
                        'ofertas' => $onlyOffers ? 1 : null,
                        'destacados' => $onlyFeatured ? 1 : null,
                    ], static fn ($value) => $value !== null && $value !== '')),
                    'isSelected' => $selectedGroup === $key,
                    'isOpenByDefault' => $defaultOpenKey === $key,
                    'categories' => $categoriesPayload,
                ];
            })
            ->values()
            ->all();
    }

    private function serializeAnnouncement(SiteAnnouncement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'message' => $announcement->message,
            'linkUrl' => $announcement->link_url,
            'displayType' => $announcement->display_type,
            'imageUrl' => $this->normalizeMediaUrl($announcement->image_url),
            'mobileImageUrl' => $this->normalizeMediaUrl($announcement->mobile_image_url),
        ];
    }

    private function serializeCatalogProduct(Product $product, int $cartQty, \Illuminate\Support\Carbon $newSince): array
    {
        $images = $this->productImages($product);
        $displayPrice = $product->effectivePrice();
        $discountPercentage = $product->offerIsActive() && $product->price > 0
            ? (int) round((1 - ($displayPrice / $product->price)) * 100)
            : 0;

        return [
            'id' => $product->id,
            'slug' => $product->slug,
            'name' => $product->name,
            'categoryName' => (string) ($product->category?->name ?? ''),
            'categorySlug' => (string) ($product->category?->slug ?? ''),
            'categoryGroupKey' => (string) ($product->category?->group_key ?? ''),
            'detailUrl' => route('store.product.show', $product->slug),
            'images' => $images,
            'imageUrl' => $images[0] ?? asset('assets/img/logo-placeholder.svg'),
            'imageFallbackUrl' => asset('assets/img/logo-placeholder.svg'),
            'price' => (int) $product->price,
            'priceLabel' => $this->money((int) $product->price),
            'offerPrice' => $product->offerIsActive() ? (int) $product->offer_price : null,
            'offerPriceLabel' => $product->offerIsActive() && $product->offer_price !== null ? $this->money((int) $product->offer_price) : '',
            'displayPrice' => $displayPrice,
            'displayPriceLabel' => $this->money($displayPrice),
            'hasOffer' => $product->offerIsActive(),
            'discountPercentage' => $discountPercentage,
            'isNew' => $product->created_at !== null && $product->created_at->greaterThanOrEqualTo($newSince),
            'isFeatured' => (bool) $product->is_featured,
            'cartQty' => $cartQty,
            'cartQtyLabel' => $cartQty > 9 ? '9+' : (string) $cartQty,
            'searchText' => trim($product->name . ' ' . ($product->sku ?? '')),
            'shortDescription' => $product->short_description,
            'addToCartAction' => route('cart.add'),
            'removeFromCartAction' => route('cart.remove'),
            'buyWhatsappUrl' => $this->buildWhatsappUrl('Hola! quiero comprar el siguiente articulo: ' . $product->name . ' - $' . $this->money($displayPrice) . ', esta disponible?'),
        ];
    }

    private function serializeDetailProduct(Product $product, int $cartQty, \Illuminate\Support\Carbon $newSince): array
    {
        $images = $this->productImages($product);
        $displayPrice = $product->effectivePrice();
        $plainDescription = trim(strip_tags((string) $product->description));
        $words = preg_split('/\s+/', $plainDescription, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $wordLimit = max(40, min(1000, (int) SiteGlobalConfig::value('product_detail_description_word_limit', '100')));
        $shortDescription = count($words) > $wordLimit ? implode(' ', array_slice($words, 0, $wordLimit)) . '...' : $plainDescription;
        $hasOffer = $product->offerIsActive();
        $basePrice = (int) $product->price;
        $discountPercentage = $hasOffer && $product->offer_price !== null && $basePrice > 0
            ? (int) round((($basePrice - (int) $product->offer_price) / $basePrice) * 100)
            : 0;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'categoryName' => (string) ($product->category?->name ?? ''),
            'images' => $images,
            'imageUrl' => $images[0] ?? asset('assets/img/logo-placeholder.svg'),
            'imageFallbackUrl' => asset('assets/img/logo-placeholder.svg'),
            'priceLabel' => $this->money($basePrice),
            'offerPriceLabel' => $hasOffer && $product->offer_price !== null ? $this->money((int) $product->offer_price) : '',
            'displayPriceLabel' => $this->money($displayPrice),
            'hasOffer' => $hasOffer,
            'discountPercentage' => $discountPercentage,
            'isNew' => $product->created_at !== null && $product->created_at->greaterThanOrEqualTo($newSince),
            'isFeatured' => (bool) $product->is_featured,
            'description' => (string) ($product->description ?? ''),
            'descriptionShort' => $shortDescription,
            'hasLongDescription' => count($words) > $wordLimit,
            'cartQty' => $cartQty,
            'addToCartAction' => route('cart.add'),
            'whatsappUrl' => $this->buildWhatsappUrl('Hola que tal, estoy interesado en comprar el siguiente articulo: ' . $product->name . ' - $' . $this->money($displayPrice) . ' esta disponible?'),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function productImages(Product $product): array
    {
        return array_values(array_filter([
            $this->normalizeMediaUrl($product->image_url),
            $this->normalizeMediaUrl($product->image_url_2),
            $this->normalizeMediaUrl($product->image_url_3),
        ], static fn (?string $value): bool => (string) $value !== ''));
    }

    /**
     * @param Collection<int, array<string, mixed>> $items
     */
    private function buildCartWhatsappUrl(Collection $items, int $total): string
    {
        $lines = ["ME GUSTARIA COMPRAR LO SIGUIENTE:"];

        foreach ($items as $item) {
            $lines[] = '- ' . $item['name'] . ' x' . $item['qty'] . ' ($' . $item['subtotalLabel'] . ')';
        }

        $lines[] = 'TOTAL: $' . $this->money($total);

        return $this->buildWhatsappUrl(implode("\n", $lines));
    }

    private function buildWhatsappUrl(string $message): string
    {
        $contact = SiteContactConfig::query()->find(1);
        $number = preg_replace('/\D+/', '', (string) ($contact?->whatsapp_number ?: SiteGlobalConfig::value('whatsapp_number', config('tienda.whatsapp_number'))));

        return 'https://wa.me/' . $number . '?text=' . rawurlencode($message);
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

    private function money(int $amount): string
    {
        return number_format($amount, 0, ',', '.');
    }

    private function truthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on', 'si'], true);
    }

    /**
     * @param array<string, string|int|null> $overrides
     * @param array{query: string, selectedCategory: string, selectedGroup: string, order: string, onlyNew: bool, onlyOffers: bool, onlyFeatured: bool} $filters
     * @return array<string, string|int>
     */
    private function catalogQuery(array $overrides, array $filters): array
    {
        $query = [
            'categoria' => $filters['selectedCategory'] !== '' ? $filters['selectedCategory'] : null,
            'grupo' => $filters['selectedGroup'] !== '' ? $filters['selectedGroup'] : null,
            'q' => $filters['query'] !== '' ? $filters['query'] : null,
            'orden' => $filters['order'] !== 'fecha_ingreso' ? $filters['order'] : null,
            'novedades' => $filters['onlyNew'] ? 1 : null,
            'ofertas' => $filters['onlyOffers'] ? 1 : null,
            'destacados' => $filters['onlyFeatured'] ? 1 : null,
        ];

        foreach ($overrides as $key => $value) {
            $query[$key] = $value;
        }

        return array_filter($query, static fn ($value) => $value !== null && $value !== '');
    }

    private function safeRouteConfigValue(string $key, string $default): string
    {
        $value = trim((string) (SiteGlobalConfig::value($key, $default) ?? $default));

        if ($value === '') {
            return $default;
        }

        $path = strtolower(trim((string) parse_url($value, PHP_URL_PATH)));

        if (in_array($path, ['/reparacion', '/reparacion.php', 'reparacion', 'reparacion.php'], true)) {
            return $default;
        }

        return $value;
    }

    /**
     * @return array<string, string>
     */
    private function groupLabels(): array
    {
        $default = [
            'jugueteria' => 'JUGUETERIA',
            'computacion' => 'COMPUTACION',
            'celulares' => 'CELULARES',
            'electronica' => 'ELECTRONICA',
        ];

        $raw = SiteGlobalConfig::value('catalog_category_groups_json', '');
        if (!is_string($raw) || trim($raw) === '') {
            return $default;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $default;
        }

        foreach ($decoded as $key => $label) {
            if (!is_string($key) || !is_string($label) || trim($key) === '' || trim($label) === '') {
                continue;
            }

            $default[strtolower($key)] = strtoupper($label);
        }

        return $default;
    }
}
