<?php

namespace App\Http\Controllers\Repairs;

use App\Http\Controllers\Controller;
use App\Http\Requests\Repairs\RepairOrderRequest;
use App\Models\RepairEvent;
use App\Models\RepairAnnotation;
use App\Models\RepairDeviceModel;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairPart;
use App\Models\RepairPartBox;
use App\Models\RepairTaskItem;
use App\Models\RepairServiceOption;
use App\Models\SiteGlobalConfig;
use App\Services\RepairService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class WorkbenchController extends Controller
{
    private const PARTS_SPREADSHEET_CONFIG_KEY = 'repair_parts_spreadsheet_url';
    private const DEFAULT_PARTS_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/15Yf1xz10GVpduWHsEH1ySmCxOCuIw6SUfUTc-6Li1-Q/edit?usp=drive_link';

    /** @var array<int, int>|null */
    private ?array $taskQueuePositions = null;

    public function consultations(Request $request, RepairService $repairService): Response
    {
        $user = $request->user();
        $isAdmin = $user !== null && in_array($user->role, ['admin', 'editor'], true);

        if (! $isAdmin && ! $request->session()->get('repair_tech_authenticated', false)) {
            return Inertia::render('Repairs/TechLoginPage');
        }

        return $this->workbenchResponse($request, $repairService, 'consultas');
    }

    public function log(Request $request): Response
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date'],
        ]);
        $date = (string) ($validated['date'] ?? now()->toDateString());
        $events = RepairEvent::query()
            ->whereDate('created_at', $date)
            ->where('evento', '!=', 'CREADA')
            ->whereNotIn('evento', ['CAMBIO_ESTADO', 'CAMBIO_ESTADO_DIRECTO'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();
        $orders = RepairOrder::query()
            ->whereIn('id', $events->pluck('orden_id')->unique()->values())
            ->get()
            ->keyBy(fn (RepairOrder $order): string => $this->repairCollectionKey($order));

        return Inertia::render('Repairs/LogPage', [
            'date' => $date,
            'events' => $events
                ->map(fn (RepairEvent $event): array => $this->serializeLogEvent($event, $orders->get($event->orden_id . ':' . $event->reparacion)))
                ->values()
                ->all(),
            'summary' => [
                'total' => $events->count(),
                'delivered' => $events->where('evento', 'ENTREGADA')->count(),
                'cancelled' => $events->filter(fn (RepairEvent $event): bool => str_contains((string) $event->evento, 'CANCEL'))->count(),
                'updated' => $events->filter(fn (RepairEvent $event): bool => in_array((string) $event->evento, ['ACTUALIZADA', 'ACTUALIZADA_ENTREGADA', 'RENUMERADA', 'COMENTARIO_TECNICO'], true))->count(),
            ],
        ]);
    }

    public function index(Request $request, RepairService $repairService): Response
    {
        return $this->workbenchResponse($request, $repairService, 'ingreso');
    }

    private function workbenchResponse(Request $request, RepairService $repairService, string $pageMode): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string'],
            'estado' => ['nullable', 'string'],
            'prioridad' => ['nullable', 'string'],
            'summary_range' => ['nullable', 'string'],
            'summary_from' => ['nullable', 'date'],
            'summary_to' => ['nullable', 'date'],
            'categoria_filter' => ['nullable', 'integer', 'min:0'],
            'ordenar_por' => ['nullable', 'string'],
            'direccion' => ['nullable', 'string'],
            'filter_id' => ['nullable', 'string'],
            'filter_cliente' => ['nullable', 'string'],
            'filter_dni' => ['nullable', 'string'],
            'filter_contacto' => ['nullable', 'string'],
            'filter_ingreso' => ['nullable', 'date'],
            'filter_trabajo' => ['nullable', 'string'],
            'filter_modelo' => ['nullable', 'string'],
            'filter_falla' => ['nullable', 'string'],
            'filter_estimada' => ['nullable', 'date'],
            'filter_saldo' => ['nullable', 'string'],
            'filter_estado' => ['nullable', 'string'],
            'from_order' => ['nullable', 'integer', 'min:1'],
            'q_fields' => ['nullable', 'array'],
            'q_fields.*' => ['string'],
        ]);

        $prefillOrder = $pageMode === 'ingreso' && isset($filters['from_order'])
            ? RepairOrder::query()
                ->where('id', (int) $filters['from_order'])
                ->orderBy('reparacion')
                ->first()
            : null;
        $searchTerm = trim((string) ($filters['q'] ?? ''));
        $filters['q_fields'] = $this->normalizeSearchFields($filters['q_fields'] ?? null);

        if ($searchTerm !== '') {
            $filters['summary_range'] = 'all';
            $filters['summary_from'] = '';
            $filters['summary_to'] = '';
            $filters['categoria_filter'] = '';
        }

        $orders = $repairService->activeOrders($filters);
        $deliveredSearchOrders = $searchTerm !== ''
            ? $repairService->deliveredOrders([
                ...$filters,
                'estado' => '',
                'prioridad' => '',
            ])
            : collect();
        $deliveredSearchMatches = $deliveredSearchOrders->count();
        $archivedSearchMatches = $searchTerm !== ''
            ? $repairService->archivedOrders([
                ...$filters,
                'estado' => '',
                'prioridad' => '',
            ])->count()
            : 0;

        return Inertia::render('Repairs/WorkbenchPage', [
            'filters' => $filters,
            'tickets' => $this->groupTickets($orders, false),
            'deliveredSearchTickets' => $this->groupTickets($deliveredSearchOrders, true),
            'summary' => $repairService->summary($filters),
            'deliveredSearchMatches' => $deliveredSearchMatches,
            'archivedSearchMatches' => $archivedSearchMatches,
            'states' => $repairService->availableStates(false),
            'serviceCategories' => $this->serviceCategories(),
            'serviceTemplates' => $repairService->serviceTemplates(),
            'failureTemplates' => $repairService->failureTemplates(),
            'serviceOptionUsage' => $repairService->serviceOptionUsage(),
            'partInventory' => $this->partInventoryOptions(),
            'deviceModels' => $repairService->deviceModelOptions(),
            'nextOrderId' => $repairService->nextOrderId(),
            'pageMode' => $pageMode,
            'initialCreateClient' => $prefillOrder instanceof RepairOrder ? [
                'nombre_cliente' => $prefillOrder->nombre_cliente,
                'dni' => $prefillOrder->dni,
                'contacto' => $prefillOrder->contacto,
            ] : null,
        ]);
    }

    /**
     * @param mixed $fields
     * @return array<int, string>
     */
    private function normalizeSearchFields(mixed $fields): array
    {
        $allowed = ['id', 'cliente', 'dni', 'contacto', 'modelo', 'ingreso', 'estimada', 'saldo', 'estado'];

        if (! is_array($fields) || $fields === []) {
            return $allowed;
        }

        $selected = array_values(array_intersect($allowed, array_map('strval', $fields)));

        return $selected;
    }

    public function delivered(Request $request, RepairService $repairService): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string'],
            'estado' => ['nullable', 'string'],
            'orden' => ['nullable', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'q_fields' => ['nullable', 'array'],
            'q_fields.*' => ['string'],
        ]);
        $filters['q_fields'] = $this->normalizeSearchFields($filters['q_fields'] ?? null);

        $orders = $repairService->deliveredOrders($filters);
        $allTickets = collect($this->groupTickets($orders, true));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = 12;
        $tickets = $allTickets->forPage($page, $perPage)->values()->all();

        return Inertia::render('Repairs/DeliveredPage', [
            'filters' => $filters,
            'tickets' => $tickets,
            'summary' => $repairService->summary(),
            'states' => $repairService->availableStates(true),
            'pageKind' => 'delivered',
            'pageTitle' => 'Entregados',
            'indexRoute' => 'repairs.delivered',
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $allTickets->count(),
                'totalPages' => max(1, (int) ceil(max(1, $allTickets->count()) / $perPage)),
            ],
        ]);
    }

    public function archived(Request $request, RepairService $repairService): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string'],
            'estado' => ['nullable', 'string'],
            'orden' => ['nullable', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'q_fields' => ['nullable', 'array'],
            'q_fields.*' => ['string'],
        ]);
        $filters['q_fields'] = $this->normalizeSearchFields($filters['q_fields'] ?? null);

        $orders = $repairService->archivedOrders($filters);
        $allTickets = collect($this->groupTickets($orders, false));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = 12;
        $tickets = $allTickets->forPage($page, $perPage)->values()->all();

        return Inertia::render('Repairs/DeliveredPage', [
            'filters' => $filters,
            'tickets' => $tickets,
            'summary' => $repairService->summary(),
            'states' => $repairService->availableStates(false),
            'pageKind' => 'archived',
            'pageTitle' => 'Archivados',
            'indexRoute' => 'repairs.archived',
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $allTickets->count(),
                'totalPages' => max(1, (int) ceil(max(1, $allTickets->count()) / $perPage)),
            ],
        ]);
    }

    public function parts(Request $request): Response
    {
        $period = (string) $request->query('periodo', 'week');
        if (! in_array($period, ['week', 'month', 'all'], true)) {
            $period = 'week';
        }

        $query = RepairOrder::query()
            ->where('repuesto_pedido', true)
            ->whereNull('repuesto_pedido_oculto_at')
            ->whereNotNull('repuesto')
            ->where('repuesto', '<>', '');

        if ($period === 'week') {
            $query->where('repuesto_pedido_at', '>=', now()->subDays(6)->startOfDay());
        } elseif ($period === 'month') {
            $query->where('repuesto_pedido_at', '>=', now()->startOfMonth());
        }

        $categoryLabels = collect($this->serviceCategories())->pluck('label', 'value')->all();

        return Inertia::render('Repairs/PartsPage', [
            'period' => $period,
            'rows' => $query
                ->orderByDesc('repuesto_pedido_at')
                ->orderByDesc('id')
                ->orderBy('reparacion')
                ->get()
                ->map(fn (RepairOrder $order): array => [
                    'registro_id' => $order->registro_id,
                    'tipo_repuesto' => $categoryLabels[(int) $order->categorias_reparacion] ?? 'Varios',
                    'repuesto' => $order->repuesto,
                    'pedido' => sprintf('#%d - Reparacion %d', $order->id, $order->reparacion),
                    'cliente' => $order->nombre_cliente,
                    'fecha' => optional($order->repuesto_pedido_at)->format('Y-m-d'),
                    'ticket_url' => route('repairs.tickets.show', ['orderId' => $order->id]),
                    'remove_url' => route('repairs.parts.remove', $order),
                ])
                ->values()
                ->all(),
            'filters' => [
                'week' => route('repairs.parts', ['periodo' => 'week']),
                'month' => route('repairs.parts', ['periodo' => 'month']),
                'all' => route('repairs.parts', ['periodo' => 'all']),
            ],
            'pendingCellphoneParts' => RepairOrder::query()
                ->where('categorias_reparacion', 1)
                ->where('estado', 'PENDIENTE')
                ->where('entregado', 'no')
                ->whereNull('archivado_at')
                ->orderByDesc('fecha')
                ->orderByDesc('id')
                ->orderBy('reparacion')
                ->get()
                ->map(fn (RepairOrder $order): array => [
                    'registro_id' => $order->registro_id,
                    'marca' => trim((string) ($order->marca ?? '')),
                    'modelo' => trim((string) ($order->modelo ?? '')),
                    'repair_type' => $this->pendingCellphoneRepairType($order),
                    'pedido' => sprintf('#%d - Reparacion %d', $order->id, $order->reparacion),
                    'cliente' => $order->nombre_cliente,
                    'ticket_url' => route('repairs.tickets.show', ['orderId' => $order->id]),
                ])
                ->values()
                ->all(),
            'inventory' => RepairPart::query()
                ->get()
                ->sortBy(fn (RepairPart $part): string => sprintf(
                    '%06d-%06d-%06d',
                    $this->boxSortOrder((string) $part->box),
                    (int) $part->sort_order,
                    (int) $part->id,
                ))
                ->map(fn (RepairPart $part): array => $this->serializeRepairPart($part))
                ->values()
                ->all(),
            'boxes' => RepairPartBox::query()
                ->orderBy('sort_order')
                ->orderBy('code')
                ->pluck('code')
                ->all(),
            'inventoryActions' => [
                'store' => route('repairs.parts.inventory.store'),
                'sync' => route('repairs.parts.inventory.sync'),
                'storeBox' => route('repairs.parts.boxes.store'),
            ],
        ]);
    }

    public function storePartInventory(Request $request): RedirectResponse
    {
        $validated = $this->validatePartInventory($request);

        $this->ensurePartBox($validated['box']);

        $nextSortOrder = ((int) RepairPart::query()->max('sort_order')) + 1;

        RepairPart::query()->create([
            ...$validated,
            'sort_order' => $nextSortOrder,
        ]);

        return back()->with('success', 'Repuesto agregado al inventario.');
    }

    public function syncPartInventory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'confirmed' => ['accepted'],
        ]);

        if (! filter_var($validated['confirmed'] ?? false, FILTER_VALIDATE_BOOL)) {
            return back()->with('error', 'La sincronizacion fue cancelada.');
        }

        try {
            $response = Http::timeout(20)->get($this->partsSpreadsheetCsvUrl());
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with('error', 'No se pudo leer la planilla de repuestos.');
        }

        if (! $response->successful()) {
            return back()->with('error', 'No se pudo leer la planilla de repuestos.');
        }

        $rows = $this->parsePartsCsv($response->body());

        if ($rows === []) {
            return back()->with('error', 'La planilla no tiene repuestos validos para importar.');
        }

        DB::transaction(function () use ($rows): void {
            RepairPart::query()->delete();
            RepairPartBox::query()->delete();

            foreach (array_chunk($rows, 100) as $chunk) {
                RepairPart::query()->insert($chunk);
            }

            $now = now();
            $boxes = collect($rows)
                ->pluck('box')
                ->unique()
                ->sortBy(fn (string $box): int => $this->boxSortOrder($box))
                ->values()
                ->map(fn (string $box): array => [
                    'code' => $box,
                    'sort_order' => $this->boxSortOrder($box),
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all();

            if ($boxes !== []) {
                RepairPartBox::query()->insert($boxes);
            }
        });

        return back()->with('success', sprintf('Inventario sincronizado: %d repuesto(s) importados.', count($rows)));
    }

    public function partsSettings(): Response
    {
        $spreadsheetUrl = $this->partsSpreadsheetPageUrl();

        return Inertia::render('Repairs/PartsSettingsPage', [
            'spreadsheetUrl' => $spreadsheetUrl,
            'csvUrl' => $this->partsSpreadsheetCsvUrl(),
            'defaultSpreadsheetUrl' => self::DEFAULT_PARTS_SPREADSHEET_URL,
            'actions' => [
                'save' => route('repairs.parts.settings.save'),
            ],
        ]);
    }

    public function savePartsSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'spreadsheet_url' => ['required', 'url', 'max:1000'],
        ]);

        $spreadsheetUrl = trim((string) $validated['spreadsheet_url']);
        SiteGlobalConfig::putValue(self::PARTS_SPREADSHEET_CONFIG_KEY, $spreadsheetUrl);

        return back()->with('success', 'Base de repuestos actualizada.');
    }

    public function updatePartInventory(Request $request, RepairPart $repairPart): RedirectResponse
    {
        if ($repairPart->reserved_order_id !== null) {
            return back()->with('error', 'No se puede editar un repuesto reservado.');
        }

        $validated = $this->validatePartInventory($request);

        $this->ensurePartBox($validated['box']);
        $repairPart->update($validated);

        return back()->with('success', 'Repuesto actualizado.');
    }

    public function destroyPartInventory(RepairPart $repairPart): RedirectResponse
    {
        if ($repairPart->reserved_order_id !== null) {
            return back()->with('error', 'No se puede eliminar un repuesto reservado.');
        }

        $repairPart->delete();

        return back()->with('success', 'Repuesto eliminado del inventario.');
    }

    public function storePartBox(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'box' => ['required', 'string', 'max:16', 'regex:/^[a-zA-Z]+$/'],
        ]);

        $box = strtolower(trim((string) $validated['box']));
        $this->ensurePartBox($box);

        return back()->with('success', sprintf('Caja %s agregada.', strtoupper($box)));
    }

    public function removePartRequest(RepairOrder $repairOrder): RedirectResponse
    {
        $repairOrder->update([
            'repuesto_pedido' => false,
            'repuesto_pedido_oculto_at' => now(),
        ]);

        return back()->with('success', 'Repuesto quitado de la lista de pedidos.');
    }

    private function validatePartInventory(Request $request): array
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0', 'max:9999'],
            'model' => ['required', 'string', 'max:255'],
            'box' => ['required', 'string', 'max:16', 'regex:/^[a-zA-Z]+$/'],
        ]);

        $validated['model'] = trim((string) $validated['model']);
        $validated['box'] = strtolower(trim((string) $validated['box']));

        return $validated;
    }

    private function ensurePartBox(string $box): void
    {
        $code = strtolower(trim($box));

        if ($code === '') {
            return;
        }

        RepairPartBox::query()->firstOrCreate(
            ['code' => $code],
            ['sort_order' => $this->boxSortOrder($code)],
        );
    }

    private function boxSortOrder(string $box): int
    {
        $code = strtolower(trim($box));
        $value = 0;

        foreach (str_split($code) as $char) {
            if ($char < 'a' || $char > 'z') {
                continue;
            }

            $value = ($value * 26) + (ord($char) - 96);
        }

        return $value > 0 ? $value : 999999;
    }

    private function partsSpreadsheetCsvUrl(): string
    {
        return $this->spreadsheetPageUrlToCsv($this->partsSpreadsheetPageUrl());
    }

    private function partsSpreadsheetPageUrl(): string
    {
        $configured = trim((string) SiteGlobalConfig::value(self::PARTS_SPREADSHEET_CONFIG_KEY, self::DEFAULT_PARTS_SPREADSHEET_URL));

        return $configured !== '' ? $configured : self::DEFAULT_PARTS_SPREADSHEET_URL;
    }

    private function spreadsheetPageUrlToCsv(string $url): string
    {
        $url = trim($url);

        if (str_contains($url, '/export') && str_contains($url, 'format=csv')) {
            return $url;
        }

        if (preg_match('~/spreadsheets/d/([^/?#]+)~', $url, $matches) !== 1) {
            return $url;
        }

        $gid = '0';
        $query = (string) parse_url($url, PHP_URL_QUERY);
        parse_str($query, $params);

        if (isset($params['gid']) && is_scalar($params['gid'])) {
            $gid = preg_replace('/\D+/', '', (string) $params['gid']) ?: '0';
        } else {
            $fragment = (string) parse_url($url, PHP_URL_FRAGMENT);
            parse_str($fragment, $fragmentParams);

            if (isset($fragmentParams['gid']) && is_scalar($fragmentParams['gid'])) {
                $gid = preg_replace('/\D+/', '', (string) $fragmentParams['gid']) ?: '0';
            }
        }

        return sprintf('https://docs.google.com/spreadsheets/d/%s/export?format=csv&gid=%s', $matches[1], $gid);
    }

    /**
     * @return array<int, array{quantity:int, model:string, box:string, sort_order:int, created_at:\Illuminate\Support\Carbon, updated_at:\Illuminate\Support\Carbon}>
     */
    private function parsePartsCsv(string $csv): array
    {
        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            return [];
        }

        fwrite($handle, $csv);
        rewind($handle);

        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);

            return [];
        }

        $columns = $this->partsCsvColumns($headers);
        if ($columns['quantity'] === null || $columns['model'] === null || $columns['box'] === null) {
            fclose($handle);

            return [];
        }

        $rows = [];
        $sortOrder = 1;
        $now = now();

        while (($line = fgetcsv($handle)) !== false) {
            $model = trim((string) ($line[$columns['model']] ?? ''));
            $box = $this->normalizePartBox((string) ($line[$columns['box']] ?? ''));

            if ($model === '' || $box === '') {
                continue;
            }

            $quantity = trim((string) ($line[$columns['quantity']] ?? ''));

            $rows[] = [
                'quantity' => $quantity === '' ? 1 : max(0, (int) $quantity),
                'model' => $model,
                'box' => $box,
                'sort_order' => $sortOrder++,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @param array<int, string|null> $headers
     * @return array{quantity:?int, model:?int, box:?int}
     */
    private function partsCsvColumns(array $headers): array
    {
        $columns = [
            'quantity' => null,
            'model' => null,
            'box' => null,
        ];

        foreach ($headers as $index => $header) {
            $normalized = Str::of((string) $header)
                ->trim()
                ->lower()
                ->ascii()
                ->replaceMatches('/[^a-z0-9]+/', '_')
                ->trim('_')
                ->toString();

            if (in_array($normalized, ['cantidad', 'quantity', 'stock'], true)) {
                $columns['quantity'] = $index;
            } elseif (in_array($normalized, ['modelo', 'model', 'repuesto'], true)) {
                $columns['model'] = $index;
            } elseif (in_array($normalized, ['caja', 'box'], true)) {
                $columns['box'] = $index;
            }
        }

        return $columns;
    }

    private function normalizePartBox(string $box): string
    {
        return Str::of($box)
            ->trim()
            ->lower()
            ->ascii()
            ->replaceMatches('/[^a-z]/', '')
            ->substr(0, 16)
            ->toString();
    }

    private function pendingCellphoneRepairType(RepairOrder $order): string
    {
        $text = Str::of((string) $order->descripcion . ' ' . (string) $order->repuesto)
            ->lower()
            ->ascii()
            ->toString();

        return match (true) {
            str_contains($text, 'modulo'), str_contains($text, 'pantalla'), str_contains($text, 'display') => 'Cambio de modulo',
            str_contains($text, 'bateria') => 'Cambio de bateria',
            str_contains($text, 'pin'), str_contains($text, 'carga') => 'Cambio de pin',
            str_contains($text, 'placa') => 'Trabajo en placa',
            str_contains($text, 'sistema'), str_contains($text, 'software') => 'Software / sistema',
            str_contains($text, 'desbloqueo') => 'Desbloqueo',
            str_contains($text, 'revision'), str_contains($text, 'diagnostico') => 'Revision / diagnostico',
            default => 'Otros trabajos',
        };
    }

    private function serializeRepairPart(RepairPart $part): array
    {
        return [
            'id' => $part->id,
            'quantity' => $part->quantity,
            'model' => $part->model,
            'box' => $part->box,
            'reserved_order_id' => $part->reserved_order_id,
            'reserved_repair_number' => $part->reserved_repair_number,
            'update_url' => route('repairs.parts.inventory.update', $part),
            'delete_url' => route('repairs.parts.inventory.delete', $part),
        ];
    }

    private function partInventoryOptions(): array
    {
        return RepairPart::query()
            ->where('quantity', '>', 0)
            ->whereNull('reserved_order_id')
            ->get()
            ->sortBy(fn (RepairPart $part): string => sprintf(
                '%06d-%06d-%06d',
                $this->boxSortOrder((string) $part->box),
                (int) $part->sort_order,
                (int) $part->id,
            ))
            ->map(fn (RepairPart $part): array => [
                'id' => $part->id,
                'quantity' => $part->quantity,
                'model' => $part->model,
                'box' => $part->box,
            ])
            ->values()
            ->all();
    }

    private function uniqueServiceOptionValue(string $type, string $label): string
    {
        $base = Str::slug($label, '_') ?: $type;
        $value = $base;
        $suffix = 2;

        while (RepairServiceOption::query()->where('type', $type)->where('value', $value)->exists()) {
            $value = $base . '_' . $suffix++;
        }

        return $value;
    }

    private function validateDeviceModel(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'integer', 'min:1'],
            'brand' => ['nullable', 'string', 'max:80'],
            'model' => ['required', 'string', 'max:255'],
        ]);
    }

    private function canonicalDeviceModel(string $model): string
    {
        $value = Str::ascii(Str::upper($model));
        $value = preg_replace('/[^A-Z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function brandForDeviceModel(string $model, mixed $brand): ?string
    {
        $brand = $this->canonicalDeviceModel((string) $brand);

        if ($brand !== '' && $brand !== 'OTRAS') {
            return $brand;
        }

        foreach (['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'] as $knownBrand) {
            if ($model === $knownBrand || str_starts_with($model, $knownBrand . ' ')) {
                return $knownBrand;
            }
        }

        return null;
    }

    private function stripBrandFromDeviceModel(string $model, string $brand = ''): string
    {
        $knownBrands = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'];
        $brands = $brand !== '' && $brand !== 'OTRAS'
            ? array_values(array_unique([$brand, ...$knownBrands]))
            : $knownBrands;

        foreach ($brands as $knownBrand) {
            if ($model === $knownBrand) {
                return '';
            }

            if (str_starts_with($model, $knownBrand . ' ')) {
                return trim(substr($model, strlen($knownBrand) + 1));
            }
        }

        return $model;
    }

    public function lookupByDni(Request $request, RepairService $repairService): JsonResponse
    {
        $validated = $request->validate([
            'dni' => ['required', 'integer', 'min:1'],
        ]);

        return response()->json($repairService->lookupClientByDni((int) $validated['dni']));
    }

    public function store(RepairOrderRequest $request, RepairService $repairService): RedirectResponse
    {
        try {
            $order = $repairService->create($request->validated(), $request->allFiles());
        } catch (RuntimeException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('repairs.tickets.show', ['orderId' => $order->id])
            ->with('success', 'Orden de reparacion creada.');
    }

    public function addRepair(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'modelo' => ['nullable', 'string', 'max:255'],
            'marca' => ['nullable', 'string', 'max:80'],
            'color' => ['nullable', 'string', 'max:80'],
            'unlock_type' => ['nullable', 'string', 'in:pin,pattern'],
            'unlock_value' => ['nullable', 'string', 'max:80'],
            'descripcion' => ['required', 'string'],
            'observaciones' => ['nullable', 'string'],
            'monto' => ['nullable', 'numeric', 'min:0'],
            'senia' => ['nullable', 'numeric', 'min:0'],
            'senia_method' => ['nullable', 'string', 'in:efectivo,transferencia'],
            'fecha_estimada' => ['nullable', 'date'],
            'repuesto' => ['nullable', 'string', 'max:255'],
            'repuesto_pedido' => ['nullable', 'boolean'],
            'inventory_part_id' => ['nullable', 'integer', 'min:1'],
            'categorias_reparacion' => ['nullable', 'integer', 'min:1'],
            'images.*' => ['nullable', 'file', 'image', 'max:8192'],
        ]);

        try {
            $repairService->addRepair($repairOrder, $validated, $request->file('images', []));
        } catch (RuntimeException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Nueva reparacion agregada al ticket.');
    }

    public function metrics(RepairService $repairService): Response
    {
        return Inertia::render('Repairs/MetricsPage', [
            'metrics' => $repairService->metrics(),
            'actions' => [
                'saveSettings' => route('repairs.metrics.settings.save'),
            ],
        ]);
    }

    public function saveMetricsSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'profit_percentage' => ['required', 'numeric', 'min:0', 'max:1000'],
        ]);

        SiteGlobalConfig::putValue(
            RepairService::PROFIT_PERCENT_CONFIG_KEY,
            rtrim(rtrim(number_format((float) $validated['profit_percentage'], 2, '.', ''), '0'), '.'),
        );

        return back()->with('success', 'Porcentaje de ganancia actualizado.');
    }

    public function lists(RepairService $repairService): Response
    {
        return Inertia::render('Repairs/ListsPage', [
            'serviceCategories' => $this->serviceCategories(),
            'serviceOptions' => $repairService->serviceOptionRows(),
            'deviceModels' => $repairService->deviceModelOptions(),
            'actions' => [
                'storeServiceOption' => route('repairs.lists.service_options.store'),
                'storeDeviceModel' => route('repairs.lists.device_models.store'),
            ],
        ]);
    }

    public function storeServiceOption(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:service,failure'],
            'label' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'repuesto' => ['nullable', 'string', 'max:120'],
        ]);

        $type = (string) $validated['type'];
        $label = trim((string) $validated['label']);

        RepairServiceOption::query()->create([
            'type' => $type,
            'value' => $this->uniqueServiceOptionValue($type, $label),
            'label' => $label,
            'description' => trim((string) ($validated['description'] ?? '')),
            'repuesto' => $type === 'service' ? trim((string) ($validated['repuesto'] ?? '')) : null,
            'usage_count' => 0,
            'sort_order' => ((int) RepairServiceOption::query()->where('type', $type)->max('sort_order')) + 1,
            'active' => true,
        ]);

        return back()->with('success', 'Opcion agregada.');
    }

    public function updateServiceOption(Request $request, RepairServiceOption $repairServiceOption): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'repuesto' => ['nullable', 'string', 'max:120'],
            'active' => ['nullable', 'boolean'],
        ]);

        $repairServiceOption->update([
            'label' => trim((string) $validated['label']),
            'description' => trim((string) ($validated['description'] ?? '')),
            'repuesto' => $repairServiceOption->type === 'service' ? trim((string) ($validated['repuesto'] ?? '')) : null,
            'active' => filter_var($validated['active'] ?? true, FILTER_VALIDATE_BOOL),
        ]);

        return back()->with('success', 'Opcion actualizada.');
    }

    public function destroyServiceOption(RepairServiceOption $repairServiceOption): RedirectResponse
    {
        $repairServiceOption->delete();

        return back()->with('success', 'Opcion eliminada.');
    }

    public function storeDeviceModel(Request $request): RedirectResponse
    {
        $validated = $this->validateDeviceModel($request);
        $brand = $this->canonicalDeviceModel((string) ($validated['brand'] ?? ''));
        $model = $this->stripBrandFromDeviceModel($this->canonicalDeviceModel((string) $validated['model']), $brand);

        RepairDeviceModel::query()->updateOrCreate(
            [
                'category_id' => (int) $validated['category_id'],
                'normalized_model' => $model,
            ],
            [
                'brand' => $this->brandForDeviceModel($model, $brand),
                'model' => $model,
            ],
        );

        return back()->with('success', 'Modelo agregado.');
    }

    public function updateDeviceModel(Request $request, RepairDeviceModel $repairDeviceModel): RedirectResponse
    {
        $validated = $this->validateDeviceModel($request);
        $brand = $this->canonicalDeviceModel((string) ($validated['brand'] ?? ''));
        $model = $this->stripBrandFromDeviceModel($this->canonicalDeviceModel((string) $validated['model']), $brand);

        $repairDeviceModel->update([
            'category_id' => (int) $validated['category_id'],
            'brand' => $this->brandForDeviceModel($model, $brand),
            'model' => $model,
            'normalized_model' => $model,
        ]);

        return back()->with('success', 'Modelo actualizado.');
    }

    public function destroyDeviceModel(RepairDeviceModel $repairDeviceModel): RedirectResponse
    {
        $repairDeviceModel->delete();

        return back()->with('success', 'Modelo eliminado.');
    }

    public function addPayment(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_type' => ['nullable', 'string', 'in:senia,incremento'],
            'method' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:500'],
            'paid_at' => ['nullable', 'date'],
        ]);

        $repairService->addPayment($repairOrder, $validated);

        if (($validated['payment_type'] ?? 'senia') === 'incremento') {
            return back()->with('success', 'Incremento registrado.');
        }

        return back()->with('success', 'Seña registrada.');
    }

    public function deletePayment(RepairOrder $repairOrder, RepairPayment $repairPayment, RepairService $repairService): RedirectResponse
    {
        try {
            $repairService->deletePayment($repairOrder, $repairPayment);
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        if ($repairPayment->payment_type === 'incremento') {
            return back()->with('success', 'Incremento eliminado.');
        }

        return back()->with('success', 'Seña eliminada.');
    }

    public function update(RepairOrderRequest $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        try {
            $repairService->update(
                $repairOrder,
                $request->validated(),
                $request->file('images', []),
                $request->file('final_images', []),
            );
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Orden actualizada.');
    }

    public function updateInfo(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'info' => ['nullable', 'string'],
        ]);

        $info = trim((string) ($validated['info'] ?? ''));
        $previousState = $repairOrder->estado;

        RepairOrder::query()
            ->where('id', $repairOrder->id)
            ->update(['info' => $info !== '' ? $info : null]);

        if ($info !== '') {
            RepairAnnotation::query()->create([
                'body' => $info,
                'source' => 'order_info',
                'repair_order_id' => $repairOrder->id,
                'repair_order_registro_id' => $repairOrder->registro_id,
                'customer_name' => $repairOrder->nombre_cliente,
                'occurred_at' => now(),
            ]);
        }

        $repairService->recordEvent($repairOrder, 'COMENTARIO_TECNICO', $previousState, $repairOrder->estado);

        return back()->with('success', 'Info interna actualizada.');
    }

    public function updateState(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:PENDIENTE,EN REPARACION,EN REPARACION / ESPERA REPUESTO,LISTA,CANCELADA,ENTREGADA'],
            'cancelado_motivo' => ['nullable', 'required_if:estado,CANCELADA', 'string', 'max:1000'],
        ]);

        $repairService->updateState($repairOrder, $validated['estado'], $validated['cancelado_motivo'] ?? null);

        return back()->with('success', 'Estado actualizado.');
    }

    public function showTicket(int $orderId, RepairService $repairService): Response
    {
        $orders = $repairService->ticketOrders($orderId);
        abort_if($orders->isEmpty(), 404);

        $ticket = $this->groupTickets($orders, false)[0];

        return Inertia::render('Repairs/TicketPage', [
            'ticket' => $ticket,
            'summary' => [
                'totalMonto' => $ticket['totalMonto'],
                'totalSenia' => $ticket['totalSenia'],
                'saldo' => max(0, (float) $ticket['totalMonto'] - (float) $ticket['totalSenia']),
            ],
            'businessHours' => $this->businessHours(),
            'ticketPricing' => $this->ticketPricingSettings(),
            'returnUrl' => route('repairs.workbench'),
        ]);
    }

    public function addOriginalImages(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'images.*' => ['required', 'file', 'image', 'max:8192'],
        ]);

        $repairService->addOriginalImages($repairOrder, $request->file('images', []));

        return back()->with('success', 'Imagenes iniciales agregadas.');
    }

    public function removeOriginalImage(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'filename' => ['required', 'string'],
        ]);

        $repairService->removeOriginalImage($repairOrder, $validated['filename']);

        return back()->with('success', 'Imagen inicial eliminada.');
    }

    public function addFinalImages(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'images.*' => ['required', 'file', 'image', 'max:8192'],
        ]);

        $repairService->addFinalImages($repairOrder, $request->file('images', []));

        return back()->with('success', 'Imagenes finales agregadas.');
    }

    public function removeFinalImage(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'filename' => ['required', 'string'],
        ]);

        $repairService->removeFinalImage($repairOrder, $validated['filename']);

        return back()->with('success', 'Imagen final eliminada.');
    }

    public function deliver(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'fecha_entregado' => ['nullable', 'date'],
            'entrega_via' => ['nullable', 'string', 'in:dni,ticket,persona,otra'],
            'entrega_detalle' => ['nullable', 'required_if:entrega_via,otra', 'string', 'max:500'],
            'enviar_archivados' => ['nullable', 'boolean'],
        ]);

        $repairService->deliver(
            $repairOrder,
            $validated['fecha_entregado'] ?? null,
            $validated['entrega_via'] ?? null,
            $validated['entrega_detalle'] ?? null,
            filter_var($validated['enviar_archivados'] ?? false, FILTER_VALIDATE_BOOL),
        );

        return back()->with('success', filter_var($validated['enviar_archivados'] ?? false, FILTER_VALIDATE_BOOL)
            ? 'Orden enviada a archivados.'
            : 'Orden marcada como entregada.');
    }

    public function archive(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->archive($repairOrder);

        return back()->with('success', 'Orden enviada a archivados.');
    }

    public function markReady(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->markReady($repairOrder);

        return back()->with('success', 'Orden marcada como lista.');
    }

    public function cancel(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'cancelado_motivo' => ['required', 'string', 'max:1000'],
        ]);

        $repairService->cancel($repairOrder, $validated['cancelado_motivo']);

        return back()->with('success', 'Orden cancelada. Queda pendiente de retiro.');
    }

    public function moveBack(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->moveBackToConsultas($repairOrder);

        return back()->with('success', 'Orden devuelta a consultas.');
    }

    public function destroy(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->delete($repairOrder);

        return back()->with('success', 'Orden eliminada.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function groupTickets(Collection $orders, bool $delivered): array
    {
        $eventsByRepair = $this->eventsForOrders($orders);
        $paymentsByRepair = $this->paymentsForOrders($orders);
        $availableStates = app(RepairService::class)->availableStates($delivered);

        return $orders
            ->groupBy('id')
            ->map(function (Collection $ticketOrders) use ($delivered, $eventsByRepair, $paymentsByRepair, $availableStates): array {
                /** @var RepairOrder $base */
                $base = $ticketOrders->sortBy('reparacion')->first();
                $ticketInfo = $ticketOrders
                    ->pluck('info')
                    ->map(fn ($info): string => trim((string) $info))
                    ->first(fn (string $info): bool => $info !== '') ?: null;

                return [
                    'id' => $base->id,
                    'nombre_cliente' => $base->nombre_cliente,
                    'dni' => $base->dni,
                    'trackingVerifier' => $base->trackingVerifier(),
                    'trackingVerifierLabel' => $base->hasClientDni() ? 'DNI' : 'Codigo',
                    'hasClientDni' => $base->hasClientDni(),
                    'contacto' => $base->contacto,
                    'info' => $ticketInfo,
                    'fecha' => optional($base->fecha)->format('Y-m-d'),
                    'repairsCount' => $ticketOrders->count(),
                    'totalMonto' => $ticketOrders->sum(fn (RepairOrder $order): float => (float) $order->monto),
                    'totalSenia' => $ticketOrders->sum(fn (RepairOrder $order): float => (float) $order->senia),
                    'trackingUrl' => route('repairs.tracking', [
                        'id_buscado' => $base->id,
                        'dni_buscado' => $base->trackingVerifier(),
                    ]),
                    'ticketUrl' => route('repairs.tickets.show', ['orderId' => $base->id]),
                    'whatsappUrl' => $this->customerWhatsappUrl($base),
                    'addRepairAction' => route('repairs.orders.add_repair', $base),
                    'newOrderUrl' => route('repairs.ingress', ['from_order' => $base->id]),
                    'repairs' => $ticketOrders
                        ->sortBy('reparacion')
                        ->map(fn (RepairOrder $order): array => $this->serializeRepair(
                            $order,
                            $delivered,
                            $eventsByRepair->get($this->repairCollectionKey($order), collect()),
                            $paymentsByRepair->get($this->repairCollectionKey($order), collect()),
                            $availableStates,
                        ))
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeRepair(RepairOrder $order, bool $delivered, ?Collection $events = null, ?Collection $payments = null, ?array $availableStates = null): array
    {
        $events ??= $order->events()->get();
        $availableStates ??= app(RepairService::class)->availableStates($delivered);

        return [
            'registro_id' => $order->registro_id,
            'id' => $order->id,
            'reparacion' => $order->reparacion,
            'fecha' => optional($order->fecha)->format('Y-m-d'),
            'nombre_cliente' => $order->nombre_cliente,
            'dni' => $order->dni,
            'tracking_token' => $order->tracking_token,
            'contacto' => $order->contacto,
            'marca' => $order->marca,
            'modelo' => $order->modelo,
            'color' => $order->color,
            'unlock_type' => $order->unlock_type,
            'unlock_value' => $order->unlock_value,
            'descripcion' => $order->descripcion,
            'observaciones' => $order->observaciones,
            'info' => $order->info,
            'monto' => $order->monto,
            'senia' => $order->senia,
            'fecha_estimada' => optional($order->fecha_estimada)->format('Y-m-d'),
            'estado' => $order->estado,
            'entregado' => $order->entregado,
            'fecha_entregado' => optional($order->fecha_entregado)->format('Y-m-d'),
            'archivado_at' => optional($order->archivado_at)->format('Y-m-d H:i'),
            'archivado_motivo' => $order->archivado_motivo,
            'cancelado_motivo' => $order->cancelado_motivo,
            'repuesto' => $order->repuesto,
            'repuesto_pedido' => (bool) $order->repuesto_pedido,
            'repuesto_pedido_at' => optional($order->repuesto_pedido_at)->format('Y-m-d H:i'),
            'inventory_part_id' => $order->inventory_part_id,
            'inventory_part_model' => $order->inventory_part_model,
            'inventory_part_box' => $order->inventory_part_box,
            'categorias_reparacion' => $order->categorias_reparacion,
            'taskQueuePosition' => $this->taskQueuePosition($order),
            'imagenes' => $this->serializeImages($order->originalImages(), $order, false),
            'imagenes_finales' => $this->serializeImages($order->finalImages(), $order, true),
            'events' => $events->map(fn (RepairEvent $event): array => [
                'id' => $event->id,
                'evento' => $event->evento,
                'estado_anterior' => $event->estado_anterior,
                'estado_nuevo' => $event->estado_nuevo,
                'created_at' => optional($event->created_at)->format('Y-m-d H:i'),
                'usuario' => $event->usuario,
            ])->all(),
            'payments' => $this->serializePayments($order, $payments),
            'actions' => [
                'update' => route('repairs.orders.update', $order),
                'info' => route('repairs.orders.info', $order),
                'addPayment' => route('repairs.orders.payments.store', $order),
                'state' => route('repairs.orders.state', $order),
                'deliver' => route('repairs.orders.deliver', $order),
                'archive' => route('repairs.orders.archive', $order),
                'markReady' => route('repairs.orders.mark_ready', $order),
                'cancel' => route('repairs.orders.cancel', $order),
                'moveBack' => route('repairs.orders.move_back', $order),
                'delete' => route('repairs.orders.delete', $order),
                'addOriginalImages' => route('repairs.orders.images.add', $order),
                'removeOriginalImage' => route('repairs.orders.images.remove', $order),
                'addFinalImages' => route('repairs.orders.final_images.add', $order),
                'removeFinalImage' => route('repairs.orders.final_images.remove', $order),
                'addToTasks' => route('tasks.add_repair', $order),
            ],
            'availableStates' => $availableStates,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLogEvent(RepairEvent $event, ?RepairOrder $order): array
    {
        return [
            'id' => $event->id,
            'time' => optional($event->created_at)->format('H:i'),
            'createdAt' => optional($event->created_at)->format('Y-m-d H:i'),
            'event' => $event->evento,
            'label' => $this->logEventLabel((string) $event->evento),
            'tone' => $this->logEventTone((string) $event->evento),
            'orderId' => $event->orden_id,
            'repairNumber' => $event->reparacion,
            'customerName' => $order?->nombre_cliente,
            'model' => $order?->modelo,
            'description' => $order?->descripcion,
            'previousState' => $event->estado_anterior,
            'nextState' => $event->estado_nuevo,
            'user' => $event->usuario,
            'ticketUrl' => route('repairs.tickets.show', ['orderId' => $event->orden_id]),
        ];
    }

    private function logEventLabel(string $event): string
    {
        return match ($event) {
            'ACTUALIZADA' => 'Orden actualizada',
            'ACTUALIZADA_ENTREGADA' => 'Orden entregada actualizada',
            'CAMBIO_ESTADO' => 'Cambio de estado',
            'CANCELADA' => 'Orden cancelada',
            'ENTREGADA' => 'Orden entregada',
            'INCREMENTO_REGISTRADO' => 'Incremento registrado',
            'INCREMENTO_ELIMINADO' => 'Incremento eliminado',
            'PAGO_REGISTRADO' => 'Pago registrado',
            'SENA_ELIMINADA' => 'Seña eliminada',
            'RENUMERADA' => 'Orden renumerada',
            'COMENTARIO_TECNICO' => 'Comentario tecnico',
            'MOVER_A_CONSULTAS' => 'Devuelta a consultas',
            'REPUESTO_ASIGNADO_DESDE_CAJA' => 'Repuesto asignado',
            'REPUESTO_DEVUELTO_A_CAJA' => 'Repuesto devuelto',
            'REPUESTO_CONSUMIDO_EN_LISTA' => 'Repuesto consumido',
            default => Str::headline(str_replace('_', ' ', Str::lower($event))),
        };
    }

    private function logEventTone(string $event): string
    {
        if ($event === 'ENTREGADA' || str_starts_with($event, 'ENTREGA_VIA_')) {
            return 'success';
        }

        if (str_contains($event, 'CANCEL') || str_contains($event, 'ELIMIN')) {
            return 'danger';
        }

        if (str_contains($event, 'INCREMENTO') || str_contains($event, 'PAGO') || str_contains($event, 'SENA')) {
            return 'money';
        }

        if (str_contains($event, 'ACTUALIZ') || str_contains($event, 'CAMBIO') || str_contains($event, 'RENUMERADA')) {
            return 'update';
        }

        return 'default';
    }

    /**
     * @return Collection<string, Collection<int, RepairEvent>>
     */
    private function eventsForOrders(Collection $orders): Collection
    {
        $ids = $orders->pluck('id')->unique()->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $keys = $orders
            ->map(fn (RepairOrder $order): string => $this->repairCollectionKey($order))
            ->flip();

        return RepairEvent::query()
            ->whereIn('orden_id', $ids)
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn (RepairEvent $event): bool => $keys->has($event->orden_id . ':' . $event->reparacion))
            ->groupBy(fn (RepairEvent $event): string => $event->orden_id . ':' . $event->reparacion);
    }

    /**
     * @return Collection<string, Collection<int, RepairPayment>>
     */
    private function paymentsForOrders(Collection $orders): Collection
    {
        $ids = $orders->pluck('id')->unique()->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        $keys = $orders
            ->map(fn (RepairOrder $order): string => $this->repairCollectionKey($order))
            ->flip();

        return RepairPayment::query()
            ->whereIn('orden_id', $ids)
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (RepairPayment $payment): bool => $keys->has($payment->orden_id . ':' . $payment->reparacion))
            ->groupBy(fn (RepairPayment $payment): string => $payment->orden_id . ':' . $payment->reparacion);
    }

    private function repairCollectionKey(RepairOrder $order): string
    {
        return ((int) $order->id) . ':' . ((int) $order->reparacion);
    }

    private function taskQueuePosition(RepairOrder $order): ?int
    {
        if ($this->taskQueuePositions === null) {
            $this->taskQueuePositions = RepairTaskItem::query()
                ->whereNull('completed_at')
                ->oldest('task_date')
                ->oldest('created_at')
                ->oldest('id')
                ->pluck('repair_order_registro_id')
                ->values()
                ->mapWithKeys(fn ($registroId, int $index): array => [(int) $registroId => $index + 1])
                ->all();
        }

        return $this->taskQueuePositions[$order->registro_id] ?? null;
    }

    /**
     * @param array<int, string> $filenames
     * @return array<int, array<string, string>>
     */
    private function serializeImages(array $filenames, RepairOrder $order, bool $final): array
    {
        return array_values(array_map(function (string $filename) use ($order, $final): array {
            return [
                'filename' => $filename,
                'url' => asset(trim((string) config('tienda.uploads.repairs'), '/') . '/' . $filename),
                'thumbnailUrl' => asset(trim((string) config('tienda.uploads.repairs_thumbnails'), '/') . '/thumb_' . $filename),
                'deleteAction' => $final
                    ? route('repairs.orders.final_images.remove', $order)
                    : route('repairs.orders.images.remove', $order),
            ];
        }, $filenames));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function serializePayments(RepairOrder $order, ?Collection $payments = null): array
    {
        $payments ??= RepairPayment::query()
                ->where('orden_id', $order->id)
                ->where('reparacion', $order->reparacion)
                ->orderByDesc('paid_at')
                ->orderByDesc('id')
                ->get();

        return $payments
            ->map(fn (RepairPayment $payment): array => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'payment_type' => $payment->payment_type,
                'method' => $payment->method,
                'notes' => $payment->notes,
                'paid_at' => optional($payment->paid_at)->format('Y-m-d'),
                'created_at' => optional($payment->created_at)->format('Y-m-d H:i'),
                'deleteAction' => route('repairs.orders.payments.delete', [$order, $payment]),
            ])
            ->all();
    }

    /**
     * @return array<int, array{value:int,label:string}>
     */
    private function serviceCategories(): array
    {
        return [
            ['value' => 1, 'label' => 'Celulares'],
            ['value' => 2, 'label' => 'Computadoras'],
            ['value' => 3, 'label' => 'Consolas'],
            ['value' => 4, 'label' => 'Varios'],
        ];
    }

    private function businessHours(): string
    {
        return (string) SiteGlobalConfig::value(
            'footer_hours',
            'Lunes a viernes de 10:30 a 13:30 y 17:00 a 20:30 | Sábados 17:00 a 20:30',
        );
    }

    /**
     * @return array{cashDiscountEnabled:bool,cashDiscountThreshold:int,cashDiscountPercentage:float,cashDiscountNote:string}
     */
    private function ticketPricingSettings(): array
    {
        $enabled = filter_var(SiteGlobalConfig::value('repair_cash_discount_enabled', '1'), FILTER_VALIDATE_BOOL);
        $threshold = max(0, (int) SiteGlobalConfig::value('repair_cash_discount_threshold', '30000'));
        $percentage = max(0, min(100, (float) SiteGlobalConfig::value('repair_cash_discount_percentage', '10')));
        $note = trim((string) SiteGlobalConfig::value('repair_cash_discount_note', 'Abonando en efectivo tenes 10% de descuento.'));

        return [
            'cashDiscountEnabled' => $enabled,
            'cashDiscountThreshold' => $threshold,
            'cashDiscountPercentage' => $percentage,
            'cashDiscountNote' => $note !== '' ? $note : 'Abonando en efectivo tenes descuento.',
        ];
    }

    private function customerWhatsappUrl(RepairOrder $order): ?string
    {
        $phone = preg_replace('/\D+/', '', (string) ($order->contacto ?? '')) ?? '';

        if ($phone === '') {
            return null;
        }

        if (!Str::startsWith($phone, '54') && strlen($phone) >= 10) {
            $phone = '54' . $phone;
        }

        $customerName = Str::upper(trim((string) $order->nombre_cliente) ?: 'cliente');

        $message = sprintf(
            'Hola %s, te escribimos por la orden de reparacion #%d.',
            $customerName,
            (int) $order->id,
        );

        if (Str::upper((string) $order->estado) === 'LISTA') {
            $brand = Str::upper(trim((string) $order->marca) ?: 'equipo');
            $model = Str::upper(trim((string) $order->modelo));
            $description = Str::upper(trim((string) $order->descripcion) ?: 'la reparacion solicitada');
            $message = sprintf(
                "Hola, %s. ¡Tu equipo ya está listo!\nOrden #%d.\nFinalizamos la reparación de tu %s %s. El trabajo realizado fue: %s, y se completó exitosamente.\nTe esperamos por el local. ¡Ya podés pasar a retirarlo!",
                $customerName,
                (int) $order->id,
                $brand,
                $model,
                $description,
            );
        }

        return 'https://wa.me/' . $phone . '?text=' . rawurlencode($message);
    }
}
