<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\Product;
use App\Models\SiteGlobalConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $routeName = (string) $request->route()?->getName();
        $filters = $request->validate([
            'q' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer'],
            'estado' => ['nullable', 'string'],
            'include_deleted' => ['nullable', 'boolean'],
            'missing' => ['nullable', 'string'],
            'quick' => ['nullable', 'string'],
            'issue' => ['nullable', 'string'],
            'sort' => ['nullable', 'string'],
            'order' => ['nullable', 'string'],
        ]);

        $query = Product::query()->with('category');

        if ((bool) ($filters['include_deleted'] ?? false)) {
            $query->withTrashed();
        }

        if (($filters['q'] ?? '') !== '') {
            $search = '%' . trim((string) $filters['q']) . '%';
            $query->where(function ($subQuery) use ($search): void {
                $subQuery
                    ->where('name', 'like', $search)
                    ->orWhere('slug', 'like', $search)
                    ->orWhere('sku', 'like', $search);
            });
        }

        if (($filters['category_id'] ?? null) !== null) {
            $query->where('category_id', (int) $filters['category_id']);
        }

        if (($filters['estado'] ?? '') !== '') {
            $query->where('is_active', (string) $filters['estado'] === '1');
        }

        if (($filters['missing'] ?? '') === 'images') {
            $query->where(function ($subQuery): void {
                $subQuery->whereNull('image_url')->orWhere('image_url', '');
            });
        }

        if (($filters['missing'] ?? '') === 'sku') {
            $query->where(function ($subQuery): void {
                $subQuery->whereNull('sku')->orWhere('sku', '');
            });
        }

        match ((string) ($filters['quick'] ?? '')) {
            'active' => $query->where('is_active', true),
            'offers' => $query->whereNotNull('offer_price')->where('offer_price', '>', 0),
            'featured' => $query->where('is_featured', true),
            'trashed' => $query->onlyTrashed(),
            default => null,
        };

        match ((string) ($filters['issue'] ?? '')) {
            'missing_image' => $query->where(function ($subQuery): void {
                $subQuery->whereNull('image_url')->orWhere('image_url', '');
            }),
            'missing_sku' => $query->where(function ($subQuery): void {
                $subQuery->whereNull('sku')->orWhere('sku', '');
            }),
            'missing_category' => $query->where(function ($subQuery): void {
                $subQuery->whereNull('category_id')->orWhereDoesntHave('category');
            }),
            'invalid_price' => $query->where('price', '<=', 0),
            'invalid_offer' => $query
                ->whereNotNull('offer_price')
                ->where('offer_price', '>', 0)
                ->where(function ($subQuery): void {
                    $subQuery->where('price', '<=', 0)->orWhereColumn('offer_price', '>=', 'price');
                }),
            default => null,
        };

        $sort = (string) ($filters['sort'] ?? 'created_at');
        $order = (string) ($filters['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $sortMap = [
            'id' => 'id',
            'product' => 'name',
            'category' => 'category_id',
            'price' => 'price',
            'offer' => 'offer_price',
            'status' => 'is_active',
            'created_at' => 'created_at',
        ];

        $query->orderBy($sortMap[$sort] ?? 'created_at', $order);
        if ($sort !== 'id') {
            $query->orderByDesc('id');
        }

        $products = $query->get();
        $allProducts = Product::query()->withTrashed()->with('category')->get();
        $validationSummary = [
            'missing_image' => 0,
            'missing_sku' => 0,
            'missing_category' => 0,
            'invalid_price' => 0,
            'invalid_offer' => 0,
        ];

        foreach ($products as $product) {
            foreach ($this->validationWarnings($product) as $warning) {
                $validationSummary[$warning['code']]++;
            }
        }

        $categories = Category::query()
            ->withCount(['products' => fn ($categoryProducts) => $categoryProducts->whereNull('products.deleted_at')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'group_key' => $category->group_key,
                'product_count' => $category->products_count,
            ]);
        $stats = [
            'total' => $allProducts->filter(fn (Product $product): bool => $product->deleted_at === null)->count(),
            'active' => $allProducts->filter(fn (Product $product): bool => $product->deleted_at === null && $product->is_active)->count(),
            'offers' => $allProducts->filter(fn (Product $product): bool => $product->deleted_at === null && $product->offerIsActive())->count(),
            'featured' => $allProducts->filter(fn (Product $product): bool => $product->deleted_at === null && $product->is_featured)->count(),
            'trashed' => $allProducts->filter(fn (Product $product): bool => $product->deleted_at !== null)->count(),
        ];
        $config = [
            'autosaveDefault' => SiteGlobalConfig::value('admin_products_autosave', '0') === '1',
        ];

        if ($routeName === 'admin.products.missing_images') {
            return Inertia::render('Admin/ProductMissingImagesPage', [
                'items' => $products
                    ->filter(fn (Product $product): bool => collect($this->validationWarnings($product))->contains(fn (array $warning): bool => $warning['code'] === 'missing_image'))
                    ->values()
                    ->map(fn (Product $product): array => $this->serializeMissingImageProduct($product)),
                'urls' => [
                    'products' => route('admin.products.index'),
                ],
            ]);
        }

        if ($routeName === 'admin.products.missing_sku') {
            return Inertia::render('Admin/ProductMissingSkusPage', [
                'items' => $products
                    ->filter(fn (Product $product): bool => collect($this->validationWarnings($product))->contains(fn (array $warning): bool => $warning['code'] === 'missing_sku'))
                    ->values()
                    ->map(fn (Product $product): array => $this->serializeMissingSkuProduct($product)),
                'urls' => [
                    'products' => route('admin.products.index'),
                ],
            ]);
        }

        return Inertia::render('Admin/ProductsPage', [
            'filters' => $filters,
            'products' => $products->map(fn (Product $product): array => $this->serializeProduct($product)),
            'categories' => $categories,
            'validationSummary' => $validationSummary,
            'stats' => $stats,
            'config' => $config,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/ProductFormPage', [
            'product' => null,
            'categories' => Category::query()->orderBy('sort_order')->get(['id', 'name']),
            'mediaItems' => $this->serializeMediaItems(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        Product::query()->create($this->normalizePayload($request->validated()));

        return redirect()->route('admin.products.index')->with('success', 'Producto creado.');
    }

    public function quickStore(ProductRequest $request): RedirectResponse
    {
        return $this->store($request);
    }

    public function saveRotation(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'catalog_product_image_rotation_ms' => ['required', 'integer', 'min:2000', 'max:20000'],
        ]);

        SiteGlobalConfig::putValue('catalog_product_image_rotation_ms', (string) $validated['catalog_product_image_rotation_ms']);

        return back()->with('success', 'Rotacion del catalogo actualizada.');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Admin/ProductFormPage', [
            'product' => $this->serializeProduct($product, true),
            'categories' => Category::query()->orderBy('sort_order')->get(['id', 'name']),
            'mediaItems' => $this->serializeMediaItems(),
        ]);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($this->normalizePayload($request->validated(), $product));

        return redirect()->route('admin.products.index')->with('success', 'Producto actualizado.');
    }

    public function quickUpdate(ProductRequest $request, Product $product): RedirectResponse|JsonResponse
    {
        $product->update($this->normalizePayload($request->validated(), $product));
        $product->load('category');

        if ($request->expectsJson() || $request->wantsJson() || $request->ajax()) {
            return response()->json([
                'ok' => true,
                'message' => 'Producto guardado.',
                'product' => $this->serializeProduct($product),
            ]);
        }

        return redirect()->route('admin.products.index')->with('success', 'Producto actualizado.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return back()->with('success', 'Producto movido a papelera.');
    }

    public function duplicate(Product $product): RedirectResponse
    {
        $copy = $product->replicate();
        $copy->name = $product->name . ' (Copia)';
        $copy->slug = Str::slug($copy->name . '-' . Str::lower(Str::random(4)));
        $copy->is_active = false;
        $copy->save();

        return back()->with('success', 'Producto duplicado.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:products,id'],
            'action' => ['required', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'offer_percent' => ['nullable', 'numeric', 'gt:0', 'lt:100'],
        ]);

        $query = Product::query()->whereIn('id', $validated['ids']);

        match ($validated['action']) {
            'activate' => $query->update(['is_active' => true]),
            'deactivate' => $query->update(['is_active' => false]),
            'set_category' => $query->update(['category_id' => (int) $validated['category_id']]),
            'apply_offer' => $this->applyOfferPercentage($validated['ids'], (float) $validated['offer_percent']),
            'clear_offer' => $query->update([
                'offer_price' => null,
                'offer_start_at' => null,
                'offer_end_at' => null,
            ]),
            'trash' => $query->delete(),
            default => null,
        };

        return back()->with('success', 'Operacion masiva aplicada.');
    }

    private function normalizePayload(array $payload, ?Product $product = null): array
    {
        $payload['slug'] = trim((string) ($payload['slug'] ?? '')) !== ''
            ? Str::slug((string) $payload['slug'])
            : Str::slug((string) $payload['name']);
        $payload['stock_status'] = $payload['stock_status'] ?? 'instock';
        $payload['is_featured'] = (bool) ($payload['is_featured'] ?? false);
        $payload['is_active'] = (bool) ($payload['is_active'] ?? true);
        $payload['cash_discount_mode'] = in_array(($payload['cash_discount_mode'] ?? 'global'), ['global', 'percentage', 'manual', 'disabled'], true)
            ? $payload['cash_discount_mode']
            : 'global';

        if ($payload['cash_discount_mode'] !== 'percentage') {
            $payload['cash_discount_percentage'] = null;
        }

        if ($payload['cash_discount_mode'] !== 'manual') {
            $payload['cash_price'] = null;
        }

        foreach (['cash_discount_percentage', 'cash_discount_mode', 'cash_price'] as $cashColumn) {
            if (! Schema::hasColumn('products', $cashColumn)) {
                unset($payload[$cashColumn]);
            }
        }

        if ($product !== null && $payload['slug'] === $product->slug) {
            return $payload;
        }

        $baseSlug = $payload['slug'];
        $suffix = 1;
        while (Product::query()->where('slug', $payload['slug'])->when($product !== null, fn ($query) => $query->where('id', '!=', $product->id))->exists()) {
            $payload['slug'] = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        return $payload;
    }

    private function serializeProduct(Product $product, bool $full = false): array
    {
        return [
            'id' => $product->id,
            'category_id' => $product->category_id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'short_description' => $product->short_description,
            'description' => $product->description,
            'price' => $product->price,
            'offer_price' => $product->offer_price,
            'offer_start_at' => optional($product->offer_start_at)->format('Y-m-d\TH:i'),
            'offer_end_at' => optional($product->offer_end_at)->format('Y-m-d\TH:i'),
            'cash_discount_percentage' => $product->cash_discount_percentage,
            'cash_discount_mode' => $product->cashDiscountMode(),
            'cash_price' => $product->cash_price,
            'cash_effective_price' => $product->cashPrice(),
            'cash_discount_applies' => $product->cashDiscountApplies(),
            'cash_discount_effective_percentage' => $product->cashDiscountPercentage(),
            'stock' => $product->stock,
            'stock_status' => $product->stock_status,
            'image_url' => $product->image_url,
            'image_url_2' => $product->image_url_2,
            'image_url_3' => $product->image_url_3,
            'is_featured' => $product->is_featured,
            'is_active' => $product->is_active,
            'offer_is_active' => $product->offerIsActive(),
            'effective_price' => $product->effectivePrice(),
            'deleted_at' => optional($product->deleted_at)->format('Y-m-d H:i'),
            'validation' => $this->validationWarnings($product),
            'category' => $product->category?->only(['id', 'name']),
            'gallery' => $full ? $product->gallery() : null,
        ];
    }

    private function validationWarnings(Product $product): array
    {
        $warnings = [];
        $images = array_filter($product->gallery(), fn (?string $url): bool => trim((string) $url) !== '');

        if ($images === []) {
            $warnings[] = ['code' => 'missing_image', 'label' => 'sin imagen'];
        }

        if (trim((string) $product->sku) === '') {
            $warnings[] = ['code' => 'missing_sku', 'label' => 'sin sku'];
        }

        if ($product->category_id === null || $product->category === null) {
            $warnings[] = ['code' => 'missing_category', 'label' => 'sin categoria'];
        }

        if ((int) $product->price <= 0) {
            $warnings[] = ['code' => 'invalid_price', 'label' => 'precio invalido'];
        }

        if ($product->offer_price !== null && (int) $product->offer_price > 0 && ((int) $product->price <= 0 || (int) $product->offer_price >= (int) $product->price)) {
            $warnings[] = ['code' => 'invalid_offer', 'label' => 'oferta invalida'];
        }

        return $warnings;
    }

    /**
     * @param array<int, int> $ids
     */
    private function applyOfferPercentage(array $ids, float $percentage): void
    {
        Product::query()
            ->whereIn('id', $ids)
            ->get()
            ->each(function (Product $product) use ($percentage): void {
                $price = (int) $product->price;

                if ($price <= 0) {
                    return;
                }

                $offerPrice = max(1, (int) round($price - ($price * ($percentage / 100))));

                $product->update([
                    'offer_price' => $offerPrice,
                    'offer_start_at' => now(),
                ]);
            });
    }

    private function serializeMissingImageProduct(Product $product): array
    {
        $googleQuery = trim($product->name . ' ' . ($product->sku ?? ''));

        return [
            'id' => $product->id,
            'name' => $product->name,
            'categoryName' => (string) ($product->category?->name ?? 'Sin categoria'),
            'sku' => (string) ($product->sku ?? ''),
            'isActive' => (bool) $product->is_active,
            'imageStatus' => $product->image_url ? 'present' : 'missing',
            'currentImageUrl' => $product->image_url,
            'imagePreviewUrl' => $product->image_url ?: $product->image_url_2 ?: $product->image_url_3,
            'googleQuery' => $googleQuery,
            'googleImagesUrl' => 'https://www.google.com/search?tbm=isch&q=' . rawurlencode($googleQuery),
            'notes' => $product->short_description ?: $product->description ?: '',
            'saveAction' => route('admin.products.quick_update', $product),
            'editUrl' => route('admin.products.edit', $product),
            'payload' => $this->serializeProduct($product, true),
        ];
    }

    private function serializeMissingSkuProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'categoryName' => (string) ($product->category?->name ?? 'Sin categoria'),
            'price' => (int) $product->price,
            'priceLabel' => number_format((int) $product->price, 0, ',', '.'),
            'isActive' => (bool) $product->is_active,
            'imageUrl' => $product->image_url,
            'updateAction' => route('admin.products.quick_update', $product),
            'editUrl' => route('admin.products.edit', $product),
            'payload' => $this->serializeProduct($product, true),
        ];
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
            ])
            ->all();
    }
}
