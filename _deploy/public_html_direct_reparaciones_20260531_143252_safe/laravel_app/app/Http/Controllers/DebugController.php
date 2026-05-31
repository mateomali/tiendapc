<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\RepairService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DebugController extends Controller
{
    public function runtime(): JsonResponse
    {
        abort_unless(App::isLocal(), 404);

        return response()->json([
            'app' => config('app.name'),
            'env' => config('app.env'),
            'debug' => config('app.debug'),
            'php' => PHP_VERSION,
        ]);
    }

    public function database(): JsonResponse
    {
        abort_unless(App::isLocal(), 404);

        return response()->json([
            'default' => DB::getDefaultConnection(),
            'connected' => DB::connection()->getPdo() !== null,
        ]);
    }

    public function logs(): JsonResponse
    {
        $this->authorizeDebugRequest(request());

        $logPath = storage_path('logs/laravel.log');

        if (! File::exists($logPath)) {
            return response()->json([
                'exists' => false,
                'path' => $logPath,
            ]);
        }

        $contents = File::get($logPath);
        $tail = mb_substr($contents, max(0, mb_strlen($contents) - 12000));

        return response()->json([
            'exists' => true,
            'path' => $logPath,
            'size' => File::size($logPath),
            'tail' => $tail,
        ]);
    }

    public function repairs(Request $request, RepairService $repairService): JsonResponse
    {
        $this->authorizeDebugRequest($request);

        $tables = ['users', 'ordenes', 'orden_eventos'];
        $columns = [
            'ordenes' => [
                'registro_id',
                'id',
                'reparacion',
                'fecha',
                'nombre_cliente',
                'dni',
                'contacto',
                'modelo',
                'descripcion',
                'observaciones',
                'monto',
                'senia',
                'fecha_estimada',
                'estado',
                'entregado',
                'fecha_entregado',
                'imagen',
                'imagen3',
                'imagen4',
                'repuesto',
                'categorias_reparacion',
                'created_at',
                'updated_at',
            ],
            'orden_eventos' => [
                'id',
                'orden_id',
                'reparacion',
                'usuario',
                'evento',
                'estado_anterior',
                'estado_nuevo',
                'created_at',
            ],
        ];

        $report = [
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'php' => PHP_VERSION,
            'db_connection' => DB::getDefaultConnection(),
            'database' => DB::connection()->getDatabaseName(),
            'tables' => [],
            'columns' => [],
            'queries' => [],
        ];

        try {
            DB::connection()->getPdo();
            $report['db_connected'] = true;
        } catch (Throwable $exception) {
            $report['db_connected'] = false;
            $report['db_error'] = $this->exceptionSummary($exception);
        }

        foreach ($tables as $table) {
            try {
                $report['tables'][$table] = Schema::hasTable($table);
            } catch (Throwable $exception) {
                $report['tables'][$table] = $this->exceptionSummary($exception);
            }
        }

        foreach ($columns as $table => $expectedColumns) {
            $report['columns'][$table] = [];

            foreach ($expectedColumns as $column) {
                try {
                    $report['columns'][$table][$column] = Schema::hasColumn($table, $column);
                } catch (Throwable $exception) {
                    $report['columns'][$table][$column] = $this->exceptionSummary($exception);
                }
            }
        }

        foreach ([
            'ordenes_count' => fn () => DB::table('ordenes')->count(),
            'ordenes_sample' => fn () => DB::table('ordenes')->orderByDesc('id')->limit(1)->get(),
            'active_orders' => fn () => $repairService->activeOrders(['summary_range' => 'all'])->take(3)->values(),
            'summary' => fn () => $repairService->summary(['summary_range' => 'all']),
        ] as $label => $callback) {
            try {
                $report['queries'][$label] = [
                    'ok' => true,
                    'result' => $callback(),
                ];
            } catch (Throwable $exception) {
                $report['queries'][$label] = [
                    'ok' => false,
                    'error' => $this->exceptionSummary($exception),
                ];
            }
        }

        return response()->json($report);
    }

    public function badgePreview(): Response
    {
        abort_unless(App::isLocal(), 404);

        /** @var Product $product */
        $product = Product::query()
            ->with('category')
            ->where('is_active', true)
            ->whereNotNull('offer_price')
            ->where('is_featured', true)
            ->orderByDesc('created_at')
            ->firstOrFail();

        $displayPrice = $product->effectivePrice();
        $discountPercentage = $product->price > 0
            ? (int) round((1 - ($displayPrice / $product->price)) * 100)
            : 0;
        $newSince = now()->subDays(10);
        $imageUrl = $this->normalizeMediaUrl($product->image_url) ?: asset('assets/img/logo-placeholder.svg');

        return Inertia::render('Debug/BadgePreviewPage', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'categoryName' => (string) ($product->category?->name ?? 'Producto'),
                'detailUrl' => route('store.product.show', $product->slug),
                'imageUrl' => $imageUrl,
                'imageFallbackUrl' => asset('assets/img/logo-placeholder.svg'),
                'priceLabel' => number_format((int) $product->price, 0, ',', '.'),
                'displayPriceLabel' => number_format($displayPrice, 0, ',', '.'),
                'discountPercentage' => $discountPercentage,
                'isNew' => $product->created_at !== null && $product->created_at->greaterThanOrEqualTo($newSince),
                'isFeatured' => (bool) $product->is_featured,
                'hasOffer' => $product->offerIsActive(),
            ],
        ]);
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

    private function authorizeDebugRequest(Request $request): void
    {
        $key = (string) env('APP_DEBUG_KEY', '');
        abort_unless(App::isLocal() || ($key !== '' && hash_equals($key, (string) $request->query('key', ''))), 404);
    }

    /**
     * @return array{class:string,message:string,file:string,line:int}
     */
    private function exceptionSummary(Throwable $exception): array
    {
        return [
            'class' => $exception::class,
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ];
    }
}
