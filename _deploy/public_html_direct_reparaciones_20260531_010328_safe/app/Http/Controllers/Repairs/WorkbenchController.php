<?php

namespace App\Http\Controllers\Repairs;

use App\Http\Controllers\Controller;
use App\Http\Requests\Repairs\RepairOrderRequest;
use App\Models\RepairEvent;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairPart;
use App\Models\RepairPartBox;
use App\Services\RepairService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class WorkbenchController extends Controller
{
    public function consultations(Request $request, RepairService $repairService): Response
    {
        $user = $request->user();
        $isAdmin = $user !== null && in_array($user->role, ['admin', 'editor'], true);

        if (! $isAdmin && ! $request->session()->get('repair_tech_authenticated', false)) {
            return Inertia::render('Repairs/TechLoginPage');
        }

        return $this->workbenchResponse($request, $repairService, 'consultas');
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
        ]);

        $orders = $repairService->activeOrders($filters);
        $searchTerm = trim((string) ($filters['q'] ?? ''));
        $deliveredSearchMatches = $searchTerm !== ''
            ? $repairService->deliveredOrders([
                ...$filters,
                'estado' => '',
                'prioridad' => '',
            ])->count()
            : 0;

        return Inertia::render('Repairs/WorkbenchPage', [
            'filters' => $filters,
            'tickets' => $this->groupTickets($orders, false),
            'summary' => $repairService->summary($filters),
            'deliveredSearchMatches' => $deliveredSearchMatches,
            'states' => $repairService->availableStates(false),
            'serviceCategories' => $this->serviceCategories(),
            'serviceTemplates' => $repairService->serviceTemplates(),
            'partInventory' => $this->partInventoryOptions(),
            'nextOrderId' => $repairService->nextOrderId(),
            'pageMode' => $pageMode,
        ]);
    }

    public function delivered(Request $request, RepairService $repairService): Response
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string'],
            'estado' => ['nullable', 'string'],
            'orden' => ['nullable', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

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
            'descripcion' => ['required', 'string'],
            'observaciones' => ['nullable', 'string'],
            'monto' => ['nullable', 'numeric', 'min:0'],
            'senia' => ['nullable', 'numeric', 'min:0'],
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
        ]);
    }

    public function addPayment(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string', 'max:500'],
            'paid_at' => ['nullable', 'date'],
        ]);

        $repairService->addPayment($repairOrder, $validated);

        return back()->with('success', 'Seña registrada.');
    }

    public function deletePayment(RepairOrder $repairOrder, RepairPayment $repairPayment, RepairService $repairService): RedirectResponse
    {
        try {
            $repairService->deletePayment($repairOrder, $repairPayment);
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
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

    public function updateState(Request $request, RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:PENDIENTE,EN REPARACION,EN REPARACION / ESPERA REPUESTO,LISTA,CANCELADA,ENTREGADA'],
        ]);

        $repairService->updateState($repairOrder, $validated['estado']);

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
        ]);

        $repairService->deliver(
            $repairOrder,
            $validated['fecha_entregado'] ?? null,
            $validated['entrega_via'] ?? null,
            $validated['entrega_detalle'] ?? null,
        );

        return back()->with('success', 'Orden marcada como entregada.');
    }

    public function markReady(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->markReady($repairOrder);

        return back()->with('success', 'Orden marcada como lista.');
    }

    public function cancel(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $repairService->cancel($repairOrder);

        return back()->with('success', 'Orden cancelada.');
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
        return $orders
            ->groupBy('id')
            ->map(function (Collection $ticketOrders) use ($delivered): array {
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
                    'repairs' => $ticketOrders
                        ->sortBy('reparacion')
                        ->map(fn (RepairOrder $order): array => $this->serializeRepair($order, $delivered))
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
    public function serializeRepair(RepairOrder $order, bool $delivered): array
    {
        return [
            'registro_id' => $order->registro_id,
            'id' => $order->id,
            'reparacion' => $order->reparacion,
            'fecha' => optional($order->fecha)->format('Y-m-d'),
            'nombre_cliente' => $order->nombre_cliente,
            'dni' => $order->dni,
            'tracking_token' => $order->tracking_token,
            'contacto' => $order->contacto,
            'modelo' => $order->modelo,
            'descripcion' => $order->descripcion,
            'observaciones' => $order->observaciones,
            'info' => $order->info,
            'monto' => $order->monto,
            'senia' => $order->senia,
            'fecha_estimada' => optional($order->fecha_estimada)->format('Y-m-d'),
            'estado' => $order->estado,
            'entregado' => $order->entregado,
            'fecha_entregado' => optional($order->fecha_entregado)->format('Y-m-d'),
            'repuesto' => $order->repuesto,
            'repuesto_pedido' => (bool) $order->repuesto_pedido,
            'repuesto_pedido_at' => optional($order->repuesto_pedido_at)->format('Y-m-d H:i'),
            'inventory_part_id' => $order->inventory_part_id,
            'inventory_part_model' => $order->inventory_part_model,
            'inventory_part_box' => $order->inventory_part_box,
            'categorias_reparacion' => $order->categorias_reparacion,
            'imagenes' => $this->serializeImages($order->originalImages(), $order, false),
            'imagenes_finales' => $this->serializeImages($order->finalImages(), $order, true),
            'events' => $order->events()->get()->map(fn (RepairEvent $event): array => [
                'id' => $event->id,
                'evento' => $event->evento,
                'estado_anterior' => $event->estado_anterior,
                'estado_nuevo' => $event->estado_nuevo,
                'created_at' => optional($event->created_at)->format('Y-m-d H:i'),
                'usuario' => $event->usuario,
            ])->all(),
            'payments' => $this->serializePayments($order),
            'actions' => [
                'update' => route('repairs.orders.update', $order),
                'addPayment' => route('repairs.orders.payments.store', $order),
                'state' => route('repairs.orders.state', $order),
                'deliver' => route('repairs.orders.deliver', $order),
                'markReady' => route('repairs.orders.mark_ready', $order),
                'cancel' => route('repairs.orders.cancel', $order),
                'moveBack' => route('repairs.orders.move_back', $order),
                'delete' => route('repairs.orders.delete', $order),
                'addOriginalImages' => route('repairs.orders.images.add', $order),
                'removeOriginalImage' => route('repairs.orders.images.remove', $order),
                'addFinalImages' => route('repairs.orders.final_images.add', $order),
                'removeFinalImage' => route('repairs.orders.final_images.remove', $order),
            ],
            'availableStates' => app(RepairService::class)->availableStates($delivered),
        ];
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
    private function serializePayments(RepairOrder $order): array
    {
        return RepairPayment::query()
            ->where('orden_id', $order->id)
            ->where('reparacion', $order->reparacion)
            ->orderByDesc('paid_at')
            ->orderByDesc('id')
            ->get()
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

    private function customerWhatsappUrl(RepairOrder $order): ?string
    {
        $phone = preg_replace('/\D+/', '', (string) ($order->contacto ?? '')) ?? '';

        if ($phone === '') {
            return null;
        }

        if (!Str::startsWith($phone, '54') && strlen($phone) >= 10) {
            $phone = '54' . $phone;
        }

        $message = sprintf(
            'Hola %s, te escribimos por la orden de reparacion #%d.',
            trim((string) $order->nombre_cliente),
            (int) $order->id,
        );

        return 'https://wa.me/' . $phone . '?text=' . rawurlencode($message);
    }
}
