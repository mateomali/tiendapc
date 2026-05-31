<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaleStoreRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string'],
            'period' => ['nullable', 'string', 'in:today,week,month,custom,all'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $query = trim((string) ($validated['q'] ?? ''));
        $period = (string) ($validated['period'] ?? 'all');
        $customFrom = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $customTo = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : null;
        $page = max(1, (int) ($validated['page'] ?? 1));
        $sales = Sale::query()
            ->withCount('items')
            ->when($query !== '', function ($salesQuery) use ($query): void {
                $salesQuery->where(function ($subQuery) use ($query): void {
                    $subQuery
                        ->where('ticket_number', 'like', '%' . ltrim($query, '# ') . '%')
                        ->orWhere('customer_label', 'like', '%' . $query . '%');
                });
            })
            ->when($period !== 'all', function ($salesQuery) use ($period, $customFrom, $customTo): void {
                [$from, $to] = $this->periodRange($period, $customFrom, $customTo);
                $salesQuery->whereBetween('issued_at', [$from, $to]);
            })
            ->latest('issued_at')
            ->paginate(20, ['*'], 'page', $page)
            ->withQueryString();

        return Inertia::render('Admin/SalesPage', [
            'query' => $query,
            'period' => $period,
            'customRange' => [
                'from' => $customFrom?->toDateString() ?? '',
                'to' => $customTo?->toDateString() ?? '',
            ],
            'metrics' => [
                'today' => $this->saleMetricsForPeriod('today'),
                'week' => $this->saleMetricsForPeriod('week'),
                'month' => $this->saleMetricsForPeriod('month'),
                'active' => $this->saleMetricsForPeriod($period, $customFrom, $customTo),
            ],
            'sales' => collect($sales->items())
                ->map(fn (Sale $sale): array => [
                    'id' => $sale->id,
                    'ticket_number' => $sale->ticket_number,
                    'ticket_number_display' => $sale->ticketNumberDisplay(),
                    'customer_label' => $sale->customer_label,
                    'subtotal' => $sale->subtotal,
                    'total' => $sale->total,
                    'issued_at' => optional($sale->issued_at)->format('Y-m-d H:i'),
                    'items_count' => $sale->items_count,
                ]),
            'pagination' => [
                'page' => $sales->currentPage(),
                'totalPages' => $sales->lastPage(),
                'total' => $sales->total(),
                'perPage' => $sales->perPage(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/SaleFormPage', [
            'defaults' => [
                'customerLabel' => 'Consumidor final',
                'issuedAtLabel' => now()->format('d/m/Y H:i'),
            ],
            'features' => [
                'cameraScanner' => true,
            ],
            'suggestedProducts' => Product::query()
                ->where('is_active', true)
                ->orderByDesc('is_featured')
                ->orderByDesc('created_at')
                ->limit(8)
                ->get()
                ->map(fn (Product $product): array => $this->serializeSalesProduct($product)),
            'urls' => [
                'index' => route('admin.sales.index'),
                'saveApi' => route('admin.api.sales.store'),
                'productsApi' => route('admin.api.sales.products'),
            ],
        ]);
    }

    public function ticket(Sale $sale): Response
    {
        $sale->load('items');

        return Inertia::render('Admin/TicketPage', [
            'sale' => [
                'id' => $sale->id,
                'ticket_number_display' => $sale->ticketNumberDisplay(),
                'customer_label' => $sale->customer_label,
                'issued_at' => optional($sale->issued_at)->format('Y-m-d H:i'),
                'subtotal' => $sale->subtotal,
                'total' => $sale->total,
                'notes' => $sale->notes,
                'items' => $sale->items->map(fn ($item): array => [
                    'id' => $item->id,
                    'product_name_snapshot' => $item->product_name_snapshot,
                    'product_sku_snapshot' => $item->product_sku_snapshot,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                ]),
            ],
        ]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));
        $page = max(1, (int) $request->query('page', 1));
        $sales = Sale::query()
            ->withCount('items')
            ->when($query !== '', fn ($salesQuery) => $salesQuery->where('ticket_number', 'like', '%' . ltrim($query, '# ') . '%'))
            ->latest('issued_at')
            ->paginate(20, ['*'], 'page', $page);

        return response()->json([
            'ok' => true,
            'items' => collect($sales->items())
                ->map(fn (Sale $sale): array => [
                    'id' => $sale->id,
                    'ticket_number' => $sale->ticket_number,
                    'ticket_number_display' => $sale->ticketNumberDisplay(),
                    'customer_label' => $sale->customer_label,
                    'issued_at' => optional($sale->issued_at)->format('Y-m-d H:i'),
                    'total' => $sale->total,
                    'items_count' => $sale->items_count,
                ]),
            'pagination' => [
                'page' => $sales->currentPage(),
                'total_pages' => $sales->lastPage(),
                'total' => $sales->total(),
            ],
        ]);
    }

    public function apiProducts(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        return response()->json([
            'ok' => true,
            'items' => Product::query()
                ->with('category')
                ->where('is_active', true)
                ->when($query !== '', function ($productsQuery) use ($query): void {
                    $productsQuery->where(function ($subQuery) use ($query): void {
                        $subQuery
                            ->where('name', 'like', '%' . $query . '%')
                            ->orWhere('sku', 'like', '%' . $query . '%');
                    });
                })
                ->limit(20)
                ->get()
                ->map(fn (Product $product): array => $this->serializeSalesProduct($product, $query)),
        ]);
    }

    public function apiShow(Sale $sale): JsonResponse
    {
        return response()->json($sale->load('items'));
    }

    public function apiStore(SaleStoreRequest $request, SaleService $saleService): JsonResponse
    {
        $sale = $saleService->create(
            $request->validated()['items'],
            $request->user()?->id,
            (string) ($request->validated()['customer_label'] ?? 'Consumidor final'),
            $request->validated()['notes'] ?? null,
        );

        return response()->json([
            'ok' => true,
            'id' => $sale->id,
            'ticket_number' => $sale->ticket_number,
            'ticket_number_display' => $sale->ticketNumberDisplay(),
            'ticket_url' => route('admin.sales.ticket', $sale),
        ]);
    }

    public function apiDelete(Sale $sale, SaleService $saleService): JsonResponse
    {
        $saleService->delete($sale);

        return response()->json(['deleted' => true]);
    }

    private function serializeSalesProduct(Product $product, string $query = ''): array
    {
        $plainDescription = trim(strip_tags((string) ($product->description ?? '')));
        $normalizedQuery = strtoupper(trim($query));
        $normalizedSku = strtoupper(trim((string) ($product->sku ?? '')));

        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'category_name' => (string) ($product->category?->name ?? ''),
            'price' => $product->effectivePrice(),
            'image_url' => $product->image_url,
            'description_excerpt' => mb_substr($plainDescription, 0, 120) . (mb_strlen($plainDescription) > 120 ? '...' : ''),
            'exact_sku_match' => $normalizedQuery !== '' && $normalizedQuery === $normalizedSku,
        ];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function periodRange(string $period, ?Carbon $customFrom = null, ?Carbon $customTo = null): array
    {
        return match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'custom' => [$customFrom ?? now()->startOfDay(), $customTo ?? now()->endOfDay()],
            default => [Carbon::create(1970, 1, 1)->startOfDay(), now()->endOfDay()],
        };
    }

    /**
     * @return array{total: int, tickets: int, products: int, average_ticket: int}
     */
    private function saleMetricsForPeriod(string $period, ?Carbon $customFrom = null, ?Carbon $customTo = null): array
    {
        $salesQuery = Sale::query();

        if ($period !== 'all') {
            [$from, $to] = $this->periodRange($period, $customFrom, $customTo);
            $salesQuery->whereBetween('issued_at', [$from, $to]);
        }

        $saleIds = (clone $salesQuery)->pluck('id');
        $tickets = (clone $salesQuery)->count();
        $total = (int) (clone $salesQuery)->sum('total');
        $products = $saleIds->isEmpty()
            ? 0
            : (int) \App\Models\SaleItem::query()->whereIn('sale_id', $saleIds)->sum('quantity');

        return [
            'total' => $total,
            'tickets' => $tickets,
            'products' => $products,
            'average_ticket' => $tickets > 0 ? (int) round($total / $tickets) : 0,
        ];
    }
}
