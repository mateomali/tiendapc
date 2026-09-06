<?php

namespace App\Services;

use App\Models\RepairEvent;
use App\Models\RepairDeviceModel;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairPart;
use App\Models\RepairTaskItem;
use App\Models\RepairServiceOption;
use App\Models\SiteGlobalConfig;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RepairService
{
    public const PROFIT_PERCENT_CONFIG_KEY = 'repair_metrics_profit_percentage';
    public const DEFAULT_PROFIT_PERCENTAGE = 20.0;

    public const ACTIVE_STATES = [
        'PENDIENTE',
        'EN REPARACION / ESPERA REPUESTO',
        'GARANTIA',
        'LISTA',
        'CANCELADA',
    ];

    public const DELIVERED_STATES = [
        'ENTREGADA',
        'LISTA',
        'CANCELADA',
        'EN REPARACION / ESPERA REPUESTO',
    ];

    private const GLOBAL_SEARCH_FIELDS = [
        'id',
        'cliente',
        'dni',
        'contacto',
        'modelo',
        'ingreso',
        'estimada',
        'saldo',
        'estado',
    ];

    public const SERVICE_TEMPLATES = [
        'revision' => [
            'label' => 'Revision / diagnostico',
            'description' => 'Revision general del equipo',
            'repuesto' => '',
        ],
        'modulo' => [
            'label' => 'Cambio de modulo',
            'description' => 'Cambio de modulo',
            'repuesto' => 'Modulo',
        ],
        'bateria' => [
            'label' => 'Cambio de bateria',
            'description' => 'Cambio de bateria',
            'repuesto' => 'Bateria',
        ],
        'placa' => [
            'label' => 'Trabajo en placa',
            'description' => 'Trabajo en placa',
            'repuesto' => 'Placa',
        ],
        'desbloqueo' => [
            'label' => 'Desbloqueo',
            'description' => 'Desbloqueo de equipo',
            'repuesto' => '',
        ],
        'cambiar_sistema' => [
            'label' => 'Cambio de sistema',
            'description' => 'Cambio / reinstalacion de sistema',
            'repuesto' => '',
        ],
        'otro' => [
            'label' => 'Otro servicio',
            'description' => '',
            'repuesto' => '',
        ],
    ];

    public const FAILURE_TEMPLATES = [
        'No enciende' => 'No enciende.',
        'Modulo' => 'Cambio de modulo.',
        'Pin de carga' => 'Falla en pin de carga.',
        'Bateria' => 'Cambio de bateria.',
        'Software' => 'Revision de software.',
        'Humedad' => 'Equipo con posible dano por humedad.',
    ];

    private const SUMMARY_RANGE_DAYS = [
        'all' => 0,
        'year' => 365,
        'quarter' => 90,
        'month' => 31,
        'week' => 7,
        'custom' => null,
    ];

    public function activeOrders(array $filters = []): Collection
    {
        $this->archiveStaleOrders();

        $orders = $this->baseQuery(false, $filters)->get();

        if (($filters['prioridad'] ?? '') === 'tareas') {
            $positions = array_flip($this->taskQueueRegistroIds());

            return $orders
                ->sortBy(fn (RepairOrder $order): int => $positions[$order->registro_id] ?? PHP_INT_MAX)
                ->values();
        }

        return $orders;
    }

    public function deliveredOrders(array $filters = []): Collection
    {
        $this->archiveStaleOrders();

        return $this->baseQuery(true, $filters)->get();
    }

    public function archivedOrders(array $filters = []): Collection
    {
        $this->archiveStaleOrders();

        return $this->archivedQuery($filters)->get();
    }

    public function ticketOrders(int $orderId): Collection
    {
        return RepairOrder::query()
            ->where('id', $orderId)
            ->orderBy('reparacion')
            ->get();
    }

    public function track(int $orderId, int|string $verifier): Collection
    {
        $orders = RepairOrder::query()
            ->where('id', $orderId)
            ->orderBy('reparacion')
            ->get();

        if ($orders->isEmpty()) {
            return $orders;
        }

        /** @var RepairOrder $base */
        $base = $orders->first();
        $expected = $base->hasClientDni()
            ? (string) $base->dni
            : (trim((string) $base->tracking_token) !== '' ? $base->trackingVerifier() : (string) config('tienda.repair_default_dni'));

        return hash_equals($expected, trim((string) $verifier)) ? $orders : collect();
    }

    public function lookupClientByDni(int $dni): ?array
    {
        if ($dni <= 0) {
            return null;
        }

        /** @var RepairOrder|null $order */
        $order = RepairOrder::query()->where('dni', $dni)->latest('id')->first();

        if ($order === null) {
            return null;
        }

        return [
            'nombre_cliente' => $order->nombre_cliente,
            'dni' => $order->dni,
            'contacto' => $order->contacto,
            'ultima_orden' => $order->id,
        ];
    }

    public function nextOrderId(): int
    {
        return ((int) RepairOrder::query()->max('id')) + 1;
    }

    public function deviceModelOptions(): array
    {
        return RepairDeviceModel::query()
            ->orderByDesc('usage_count')
            ->orderBy('brand')
            ->orderBy('model')
            ->limit(600)
            ->get()
            ->map(fn (RepairDeviceModel $deviceModel): array => [
                'id' => $deviceModel->id,
                'category_id' => $deviceModel->category_id,
                'brand' => $deviceModel->brand,
                'model' => $deviceModel->model,
                'normalized_model' => $deviceModel->normalized_model,
                'usage_count' => $deviceModel->usage_count,
            ])
            ->all();
    }

    public function suggestedPhonePrices(): array
    {
        if (! Schema::hasTable('ordenes')) {
            return [];
        }

        $suggestions = [];

        RepairOrder::query()
            ->where('categorias_reparacion', 1)
            ->whereNotNull('modelo')
            ->where('modelo', '!=', '')
            ->whereNotNull('descripcion')
            ->where('descripcion', '!=', '')
            ->where('monto', '>', 0)
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->orderByDesc('reparacion')
            ->limit(1500)
            ->get(['id', 'reparacion', 'fecha', 'marca', 'modelo', 'descripcion', 'monto'])
            ->each(function (RepairOrder $order) use (&$suggestions): void {
                $normalizedModel = $this->stripBrandFromModel(
                    $this->normalizeDeviceModel((string) $order->modelo),
                    $this->normalizeDeviceModel((string) $order->marca),
                );
                $normalizedModel = $this->stripBrandFromModel($normalizedModel, 'MOTO');
                $normalizedRepairType = $this->normalizeRepairSuggestionType((string) $order->descripcion);

                if ($normalizedModel === '' || $normalizedRepairType === '' || isset($suggestions[$normalizedModel][$normalizedRepairType])) {
                    return;
                }

                $suggestions[$normalizedModel][$normalizedRepairType] = [
                    'amount' => (float) $order->monto,
                    'date' => $order->fecha?->toDateString(),
                    'order_id' => (int) $order->id,
                    'repair_number' => (int) $order->reparacion,
                    'repair_type' => $order->descripcion,
                ];
            });

        return $suggestions;
    }

    public function serviceOptionRows(): array
    {
        return RepairServiceOption::query()
            ->orderBy('type')
            ->orderByDesc('usage_count')
            ->orderBy('sort_order')
            ->orderBy('label')
            ->get()
            ->map(fn (RepairServiceOption $option): array => [
                'id' => $option->id,
                'type' => $option->type,
                'value' => $option->value,
                'label' => $option->label,
                'description' => $option->description ?? '',
                'repuesto' => $option->repuesto ?? '',
                'usage_count' => $option->usage_count,
                'sort_order' => $option->sort_order,
                'active' => $option->active,
            ])
            ->all();
    }

    public function create(array $payload, array $files = []): RepairOrder
    {
        return DB::transaction(function () use ($payload, $files): RepairOrder {
            $orderId = (int) ($payload['id_orden'] ?? $this->nextOrderId());

            if ($orderId <= 0) {
                throw new \RuntimeException('ID de orden invalido.');
            }

            if (RepairOrder::query()->where('id', $orderId)->exists()) {
                throw new \RuntimeException("El ID de orden #{$orderId} ya fue utilizado. Elegi otro.");
            }

            $jobs = $this->normalizeJobs($payload);
            $jobFiles = is_array($files['jobs'] ?? null) ? $files['jobs'] : [];
            $sharedImages = is_array($files['images'] ?? null) ? $files['images'] : [];
            $firstOrder = null;
            $dni = (int) ($payload['dni'] ?? config('tienda.repair_default_dni'));
            $trackingToken = $this->trackingTokenForDni($dni);
            $info = trim((string) ($payload['info'] ?? ''));

            foreach ($jobs as $index => $job) {
                $repairNumber = $index + 1;
                $model = $this->rememberDeviceModel($job['modelo'], $job['categorias_reparacion'], $job['marca'] ?? null);
                $images = is_array($jobFiles[$index]['images'] ?? null)
                    ? $jobFiles[$index]['images']
                    : ($repairNumber === 1 ? $sharedImages : []);
                $storedImages = $this->storeImages($images, $orderId, $repairNumber, 'orig');

                $requestedInventoryPartId = (int) ($job['inventory_part_id'] ?? 0);
                $allocation = $this->reserveInventoryPart($requestedInventoryPartId, $orderId, $repairNumber);

                if ($requestedInventoryPartId > 0 && $allocation === null) {
                    throw new \RuntimeException('El repuesto seleccionado ya no esta disponible.');
                }
                $partAccessories = $this->normalizePartAccessories($job, (int) $job['categorias_reparacion']);

                $order = RepairOrder::query()->create([
                    'id' => $orderId,
                    'reparacion' => $repairNumber,
                    'fecha' => now()->toDateString(),
                    'nombre_cliente' => $payload['nombre_cliente'],
                    'dni' => $dni,
                    'tracking_token' => $trackingToken,
                    'contacto' => $payload['contacto'] ?? null,
                    'marca' => $this->detectDeviceBrandFromRepairText((string) ($job['modelo'] ?? ''), (string) $job['descripcion'], (string) ($job['marca'] ?? '')),
                    'modelo' => $model,
                    'color' => $job['color'],
                    'unlock_type' => $job['unlock_type'],
                    'unlock_value' => $job['unlock_value'],
                    'descripcion' => $this->uppercaseFailure((string) $job['descripcion']),
                    'observaciones' => $job['observaciones'],
                    'info' => $info !== '' ? $info : null,
                    'monto' => $job['monto'],
                    'senia' => 0,
                    'fecha_estimada' => $job['fecha_estimada'],
                    'estado' => $job['estado'],
                    'entregado' => 'no',
                    'repuesto' => $job['repuesto'],
                    'repuesto_pedido' => $job['pedir_repuesto'],
                    'repuesto_pedido_at' => $job['pedir_repuesto'] ? now() : null,
                    'repuesto_pedido_oculto_at' => null,
                    'repuesto_agregados' => $partAccessories['items'],
                    'repuesto_agregado_otro' => $partAccessories['other'],
                    'inventory_part_id' => $allocation['id'] ?? null,
                    'inventory_part_model' => $allocation['model'] ?? null,
                    'inventory_part_box' => $allocation['box'] ?? null,
                    'categorias_reparacion' => $job['categorias_reparacion'],
                    'imagen' => implode('|', $storedImages),
                ]);

                if (Str::upper((string) $order->estado) === 'LISTA') {
                    $this->consumeInventoryReservation($order);
                }

                $this->addInitialPayment($order, $job['senia'], $job['senia_method'] ?? null);
                $this->recordEvent($order, 'CREADA', null, $order->estado);
                $firstOrder ??= $order;
            }

            return $firstOrder ?? throw new \RuntimeException('No se pudo crear la orden de reparacion.');
        });
    }

    public function addRepair(RepairOrder $order, array $payload, array $images = []): RepairOrder
    {
        return DB::transaction(function () use ($order, $payload, $images): RepairOrder {
            $repairNumber = ((int) RepairOrder::query()->where('id', $order->id)->max('reparacion')) + 1;
            $storedImages = $this->storeImages($images, $order->id, $repairNumber, 'orig');

            $partRequested = filter_var($payload['repuesto_pedido'] ?? false, FILTER_VALIDATE_BOOL);
            $part = trim((string) ($payload['repuesto'] ?? ''));
            $requestedInventoryPartId = (int) ($payload['inventory_part_id'] ?? 0);
            $allocation = $this->reserveInventoryPart($requestedInventoryPartId, $order->id, $repairNumber);
            $model = $this->rememberDeviceModel($payload['modelo'] ?? null, (int) ($payload['categorias_reparacion'] ?? 4), $payload['marca'] ?? null);

            if ($requestedInventoryPartId > 0 && $allocation === null) {
                throw new \RuntimeException('El repuesto seleccionado ya no esta disponible.');
            }
            $partAccessories = $this->normalizePartAccessories($payload, (int) ($payload['categorias_reparacion'] ?? 4));

            $repair = RepairOrder::query()->create([
                'id' => $order->id,
                'reparacion' => $repairNumber,
                'fecha' => now()->toDateString(),
                'nombre_cliente' => $order->nombre_cliente,
                'dni' => $order->dni,
                'tracking_token' => $order->tracking_token,
                'contacto' => $order->contacto,
                'marca' => $this->detectDeviceBrandFromRepairText((string) ($payload['modelo'] ?? ''), (string) ($payload['descripcion'] ?? ''), (string) ($payload['marca'] ?? $order->marca ?? '')),
                'modelo' => $model,
                'color' => trim((string) ($payload['color'] ?? '')) !== '' ? trim((string) $payload['color']) : null,
                'unlock_type' => $this->normalizeUnlockData($payload, (int) ($payload['categorias_reparacion'] ?? 4))['type'],
                'unlock_value' => $this->normalizeUnlockData($payload, (int) ($payload['categorias_reparacion'] ?? 4))['value'],
                'descripcion' => $this->uppercaseFailure((string) $payload['descripcion']),
                'observaciones' => $payload['observaciones'] ?? 'sin observaciones',
                'info' => $order->info,
                'monto' => $payload['monto'] ?? 0,
                'senia' => 0,
                'fecha_estimada' => $payload['fecha_estimada'] ?? null,
                'estado' => 'PENDIENTE',
                'entregado' => 'no',
                'repuesto' => $part,
                'repuesto_pedido' => $requestedInventoryPartId <= 0 && $partRequested && $part !== '',
                'repuesto_pedido_at' => $requestedInventoryPartId <= 0 && $partRequested && $part !== '' ? now() : null,
                'repuesto_pedido_oculto_at' => null,
                'repuesto_agregados' => $partAccessories['items'],
                'repuesto_agregado_otro' => $partAccessories['other'],
                'inventory_part_id' => $allocation['id'] ?? null,
                'inventory_part_model' => $allocation['model'] ?? null,
                'inventory_part_box' => $allocation['box'] ?? null,
                'categorias_reparacion' => $payload['categorias_reparacion'] ?? 4,
                'imagen' => implode('|', $storedImages),
            ]);

            $this->addInitialPayment($repair, $payload['senia'] ?? 0, $payload['senia_method'] ?? null);
            $this->recordEvent($repair, 'CREADA', null, $repair->estado);

            return $repair;
        });
    }

    private function reserveInventoryPart(int $partId, int $orderId, int $repairNumber): ?array
    {
        if ($partId <= 0) {
            return null;
        }

        /** @var RepairPart|null $part */
        $part = RepairPart::query()->lockForUpdate()->find($partId);

        if ($part === null || $part->quantity <= 0 || $part->reserved_order_id !== null) {
            return null;
        }

        if ($part->quantity > 1) {
            $part->decrement('quantity');

            $part = RepairPart::query()->create([
                'quantity' => 1,
                'model' => $part->model,
                'box' => $part->box,
                'sort_order' => $part->sort_order,
                'reserved_order_id' => $orderId,
                'reserved_repair_number' => $repairNumber,
                'reserved_at' => now(),
            ]);
        } else {
            $part->update([
                'reserved_order_id' => $orderId,
                'reserved_repair_number' => $repairNumber,
                'reserved_at' => now(),
            ]);
        }

        $allocation = [
            'id' => $part->id,
            'model' => $part->model,
            'box' => $part->box,
        ];

        return $allocation;
    }

    private function returnInventoryReservation(?int $partId, ?string $model, ?string $box, bool $returnToStock = true): void
    {
        if ($partId !== null && $partId > 0) {
            /** @var RepairPart|null $part */
            $part = RepairPart::query()->lockForUpdate()->find($partId);

            if ($part !== null && $part->reserved_order_id !== null) {
                $part->delete();

                if ($returnToStock) {
                    $this->returnInventoryPart($part->model, $part->box);
                }

                return;
            }

            return;
        }

        if ($returnToStock) {
            $this->returnInventoryPart($model, $box);
        }
    }

    private function consumeInventoryReservation(RepairOrder $order): void
    {
        $partId = (int) ($order->inventory_part_id ?? 0);

        if ($partId <= 0) {
            return;
        }

        /** @var RepairPart|null $part */
        $part = RepairPart::query()->lockForUpdate()->find($partId);

        if (
            $part === null
            || $part->reserved_order_id !== (int) $order->id
            || $part->reserved_repair_number !== (int) $order->reparacion
        ) {
            return;
        }

        $part->delete();
        $this->recordEvent($order, 'REPUESTO_CONSUMIDO_EN_LISTA', $order->estado, $order->estado);
    }

    private function returnInventoryPart(?string $model, ?string $box): void
    {
        $model = trim((string) $model);
        $box = strtolower(trim((string) $box));

        if ($model === '' || $box === '') {
            return;
        }

        /** @var RepairPart|null $part */
        $part = RepairPart::query()
            ->where('model', $model)
            ->where('box', $box)
            ->lockForUpdate()
            ->first();

        if ($part !== null) {
            $part->increment('quantity');

            return;
        }

        RepairPart::query()->create([
            'quantity' => 1,
            'model' => $model,
            'box' => $box,
            'sort_order' => ((int) RepairPart::query()->max('sort_order')) + 1,
        ]);
    }

    public function update(RepairOrder $order, array $payload, array $images = [], array $finalImages = []): RepairOrder
    {
        return DB::transaction(function () use ($order, $payload, $images, $finalImages): RepairOrder {
            $previousState = $order->estado;
            $previousComment = $order->observaciones;
            $oldOrderId = (int) $order->id;
            $newOrderId = (int) ($payload['id_nuevo'] ?? $oldOrderId);

            if ($newOrderId !== $oldOrderId) {
                $exists = RepairOrder::query()->where('id', $newOrderId)->exists();

                if ($exists) {
                    throw new \RuntimeException('Ya existe una orden con ese ID.');
                }

                RepairOrder::query()->where('id', $oldOrderId)->update(['id' => $newOrderId]);
                RepairEvent::query()->where('orden_id', $oldOrderId)->update(['orden_id' => $newOrderId]);
                RepairPayment::query()->where('orden_id', $oldOrderId)->update(['orden_id' => $newOrderId]);
                $order->id = $newOrderId;
            }

            $dni = (int) ($payload['dni'] ?? config('tienda.repair_default_dni'));
            $trackingToken = $this->trackingTokenForDni($dni, $order->tracking_token);
            $info = trim((string) ($payload['info'] ?? ''));

            RepairOrder::query()
                ->where('id', $newOrderId)
                ->update([
                    'nombre_cliente' => $payload['nombre_cliente'],
                    'dni' => $dni,
                    'tracking_token' => $trackingToken,
                    'contacto' => $payload['contacto'] ?? null,
                    'fecha' => $payload['fecha'] ?? $order->fecha,
                    'info' => $info !== '' ? $info : null,
                ]);

            $originalImages = array_slice(array_merge($order->originalImages(), $this->storeImages($images, $newOrderId, $order->reparacion, 'orig')), 0, 2);
            $finalStored = array_slice(array_merge($order->finalImages(), $this->storeImages($finalImages, $newOrderId, $order->reparacion, 'final')), 0, 2);

            $partRequested = filter_var($payload['repuesto_pedido'] ?? false, FILTER_VALIDATE_BOOL);
            $part = trim((string) ($payload['repuesto'] ?? ''));
            $activePartRequest = $partRequested && $part !== '';
            $previousInventoryPartId = (int) ($order->inventory_part_id ?? 0);
            $nextInventoryPartId = (int) ($payload['inventory_part_id'] ?? 0);
            $inventoryChanged = $previousInventoryPartId !== $nextInventoryPartId;
            $previousWasReady = Str::upper((string) $previousState) === 'LISTA';
            $allocation = null;

            if ($inventoryChanged && $previousInventoryPartId > 0) {
                $this->returnInventoryReservation($previousInventoryPartId, $order->inventory_part_model, $order->inventory_part_box, ! $previousWasReady);
                if (! $previousWasReady) {
                    $this->recordEvent($order, 'REPUESTO_DEVUELTO_A_CAJA', $previousState, $order->estado);
                }
            }

            if ($inventoryChanged && $nextInventoryPartId > 0) {
                $allocation = $this->reserveInventoryPart($nextInventoryPartId, $newOrderId, (int) $order->reparacion);
                if ($allocation === null) {
                    throw new \RuntimeException('El repuesto seleccionado ya no esta disponible.');
                }
                if ($allocation !== null) {
                    $this->recordEvent($order, 'REPUESTO_ASIGNADO_DESDE_CAJA', $previousState, $order->estado);
                }
            } elseif (! $inventoryChanged && $previousInventoryPartId > 0) {
                $allocation = [
                    'id' => $order->inventory_part_id,
                    'model' => $order->inventory_part_model,
                    'box' => $order->inventory_part_box,
                ];
            }

            $model = $this->rememberDeviceModel($payload['modelo'] ?? null, (int) ($payload['categorias_reparacion'] ?? 4), $payload['marca'] ?? null);
            $brand = $this->detectDeviceBrandFromRepairText((string) ($payload['modelo'] ?? ''), (string) ($payload['descripcion'] ?? ''), (string) ($payload['marca'] ?? $order->marca ?? ''));
            $partAccessories = $this->normalizePartAccessories($payload, (int) ($payload['categorias_reparacion'] ?? 4));

            $nextState = (string) ($payload['estado'] ?? $order->estado);
            $nextCancellationReason = Str::upper($nextState) === 'CANCELADA'
                ? $this->normalizeCancellationReason((string) ($payload['cancelado_motivo'] ?? $order->cancelado_motivo ?? ''))
                : null;
            $nextWarrantyReason = Str::upper($nextState) === 'GARANTIA'
                ? $this->normalizeWarrantyReason((string) ($payload['garantia_motivo'] ?? $order->garantia_motivo ?? ''))
                : $order->garantia_motivo;

            $order->fill([
                'id' => $newOrderId,
                'nombre_cliente' => $payload['nombre_cliente'],
                'dni' => $dni,
                'tracking_token' => $trackingToken,
                'contacto' => $payload['contacto'] ?? null,
                'fecha' => $payload['fecha'] ?? $order->fecha,
                'marca' => $brand,
                'modelo' => $model,
                'color' => trim((string) ($payload['color'] ?? '')) !== '' ? trim((string) $payload['color']) : null,
                'unlock_type' => $this->normalizeUnlockData($payload, (int) ($payload['categorias_reparacion'] ?? 4))['type'],
                'unlock_value' => $this->normalizeUnlockData($payload, (int) ($payload['categorias_reparacion'] ?? 4))['value'],
                'descripcion' => $this->uppercaseFailure((string) ($payload['descripcion'] ?? '')),
                'observaciones' => $payload['observaciones'] ?? 'sin observaciones',
                'info' => $info !== '' ? $info : null,
                'monto' => $payload['monto'] ?? 0,
                'senia' => $this->paymentTotal($order),
                'fecha_estimada' => $payload['fecha_estimada'] ?? null,
                'estado' => $nextState,
                'cancelado_motivo' => $nextCancellationReason,
                'garantia_motivo' => $nextWarrantyReason,
                'fecha_entregado' => $payload['fecha_entregado'] ?? $order->fecha_entregado,
                'repuesto' => ($activePartRequest || $allocation !== null) && $part !== '' ? $part : null,
                'repuesto_pedido' => $activePartRequest,
                'repuesto_pedido_at' => $activePartRequest ? ($order->repuesto_pedido_at ?? now()) : null,
                'repuesto_pedido_oculto_at' => $activePartRequest ? null : $order->repuesto_pedido_oculto_at,
                'repuesto_agregados' => $partAccessories['items'],
                'repuesto_agregado_otro' => $partAccessories['other'],
                'inventory_part_id' => $allocation['id'] ?? null,
                'inventory_part_model' => $allocation['model'] ?? null,
                'inventory_part_box' => $allocation['box'] ?? null,
                'categorias_reparacion' => $payload['categorias_reparacion'] ?? 4,
                'imagen' => implode('|', $originalImages),
                'imagen3' => $finalStored[0] ?? null,
                'imagen4' => $finalStored[1] ?? null,
            ])->save();

            if (Str::upper((string) $order->estado) === 'LISTA') {
                $this->consumeInventoryReservation($order);
            }
            $this->syncTaskQueueForState($order, (string) $order->estado);

            $this->recordEvent($order, $order->entregado === 'si' ? 'ACTUALIZADA_ENTREGADA' : 'ACTUALIZADA', $previousState, $order->estado);

            if ($oldOrderId !== $newOrderId) {
                $this->recordEvent($order, 'RENUMERADA', $previousState, $order->estado);
            }

            if ($this->hasMeaningfulCommentChange($previousComment, $order->observaciones)) {
                $this->recordEvent($order, 'COMENTARIO_TECNICO', $previousState, $order->estado);
            }

            return $order->refresh();
        });
    }

    public function markReady(RepairOrder $order): RepairOrder
    {
        return $this->setState($order, 'LISTA', 'LISTA');
    }

    public function updateState(RepairOrder $order, string $state, ?string $cancellationReason = null): RepairOrder
    {
        return $this->setState($order, $state, 'CAMBIO_ESTADO_DIRECTO', $cancellationReason);
    }

    public function reopenWarranty(RepairOrder $order, string $reason): RepairOrder
    {
        $reason = $this->normalizeWarrantyReason($reason);
        $previousState = $order->estado;
        $originalEntryDate = $order->fecha?->toDateString();

        $order->update([
            'fecha' => now()->toDateString(),
            'estado' => 'GARANTIA',
            'entregado' => 'no',
            'fecha_entregado' => null,
            'archivado_at' => null,
            'archivado_motivo' => null,
            'cancelado_motivo' => null,
            'garantia_motivo' => $reason,
        ]);

        $this->syncTaskQueueForState($order, 'GARANTIA');
        $this->recordEvent(
            $order,
            'GARANTIA_REINGRESO',
            $previousState,
            'GARANTIA',
            $originalEntryDate !== null ? 'Ingreso original: ' . $originalEntryDate : null,
        );

        return $order->refresh();
    }

    public function cancel(RepairOrder $order, string $reason): RepairOrder
    {
        $reason = $this->normalizeCancellationReason($reason);
        $previousState = $order->estado;

        $order->update([
            'estado' => 'CANCELADA',
            'entregado' => 'no',
            'fecha_entregado' => null,
            'archivado_at' => null,
            'archivado_motivo' => null,
            'cancelado_motivo' => $reason,
        ]);

        $this->syncTaskQueueForState($order, 'CANCELADA');
        $this->recordEvent($order, 'CANCELADA', $previousState, 'CANCELADA');

        return $order->refresh();
    }

    public function deliver(RepairOrder $order, ?string $date = null, ?string $via = null, ?string $detail = null, bool $archive = false): RepairOrder
    {
        if ($archive) {
            return $this->archive($order, 'manual');
        }

        $previousState = $order->estado;
        $updates = [
            'entregado' => 'si',
            'fecha_entregado' => $date ?: now()->toDateString(),
            'archivado_at' => null,
            'archivado_motivo' => null,
            'estado' => in_array($order->estado, self::DELIVERED_STATES, true) ? $order->estado : 'ENTREGADA',
        ];

        $deliveryNote = $this->deliveryObservation($via, $detail);
        if ($deliveryNote !== null) {
            $updates['observaciones'] = $this->replaceDeliveryObservation($order->observaciones, $deliveryNote);
        }

        $order->update($updates);

        $this->recordEvent($order, 'ENTREGADA', $previousState, $order->estado);

        if ($via !== null && trim($via) !== '') {
            $this->recordEvent($order, 'ENTREGA_VIA_' . Str::upper(Str::slug($via, '_')), $order->estado, $order->estado);
        }

        return $order->refresh();
    }

    private function deliveryObservation(?string $via, ?string $detail): ?string
    {
        $via = trim((string) $via);

        if ($via !== 'otra') {
            return match ($via) {
                'dni' => 'Validacion de entrega: ENTREGADO CON DNI',
                'ticket' => 'Validacion de entrega: ENTREGADO CON TICKET',
                'persona' => 'Validacion de entrega: ENTREGADO AL TITULAR EN PERSONA',
                default => null,
            };
        }

        $detail = trim((string) $detail);

        if ($detail === '') {
            return null;
        }

        return 'Validacion de entrega: ' . $detail;
    }

    private function replaceDeliveryObservation(?string $current, string $addition): string
    {
        $current = trim((string) $current);

        if ($current === '' || in_array(mb_strtolower($current, 'UTF-8'), ['sin observaciones', 'sin observacion'], true)) {
            return $addition;
        }

        $lines = preg_split('/\R+/', $current) ?: [];
        $kept = array_filter($lines, static fn (string $line): bool => ! str_starts_with(trim($line), 'Validacion de entrega:'));
        $base = trim(implode("\n", $kept));

        return $base === '' ? $addition : $base . "\n\n" . $addition;
    }

    public function moveBackToConsultas(RepairOrder $order): RepairOrder
    {
        $previousState = $order->estado;
            $order->update([
                'entregado' => 'no',
                'fecha_entregado' => null,
                'archivado_at' => null,
                'archivado_motivo' => null,
                'cancelado_motivo' => null,
                'estado' => 'PENDIENTE',
            ]);

        $this->recordEvent($order, 'MOVER_A_CONSULTAS', $previousState, 'PENDIENTE');

        return $order->refresh();
    }

    public function archive(RepairOrder $order, string $reason = 'manual'): RepairOrder
    {
        $previousState = $order->estado;

        $order->update([
            'entregado' => 'no',
            'fecha_entregado' => null,
            'archivado_at' => now(),
            'archivado_motivo' => $reason,
        ]);

        $this->recordEvent($order, 'ARCHIVADA_' . Str::upper($reason), $previousState, $order->estado);

        return $order->refresh();
    }

    public function archiveStaleOrders(): int
    {
        $staleOrders = RepairOrder::query()
            ->where('entregado', 'no')
            ->whereNull('archivado_at')
            ->whereDate('fecha', '<=', now()->subDays(60)->toDateString())
            ->get();

        foreach ($staleOrders as $order) {
            $this->archive($order, 'automatico_60_dias');
        }

        return $staleOrders->count();
    }

    public function delete(RepairOrder $order): void
    {
        foreach (array_merge($order->originalImages(), $order->finalImages()) as $image) {
            $this->deleteImage($image);
        }

        RepairPayment::query()
            ->where('orden_id', $order->id)
            ->where('reparacion', $order->reparacion)
            ->delete();

        $order->delete();
    }

    public function addPayment(RepairOrder $order, array $payload): RepairOrder
    {
        return DB::transaction(function () use ($order, $payload): RepairOrder {
            $paymentType = $payload['payment_type'] ?? 'senia';
            $amount = (float) $payload['amount'];

            RepairPayment::query()->create([
                'orden_id' => $order->id,
                'reparacion' => $order->reparacion,
                'amount' => $amount,
                'payment_type' => $paymentType,
                'method' => $paymentType === 'incremento' ? null : ($payload['method'] ?? 'efectivo'),
                'notes' => $payload['notes'] ?? null,
                'paid_at' => $payload['paid_at'] ?? now()->toDateString(),
            ]);

            if ($paymentType === 'incremento') {
                $order->forceFill(['monto' => max(0, (float) $order->monto + $amount)])->save();
                $this->recordEvent($order, 'INCREMENTO_REGISTRADO', $order->estado, $order->estado);
            } else {
                $this->syncPaymentTotal($order);
                $this->recordEvent($order, 'PAGO_REGISTRADO', $order->estado, $order->estado);
            }

            return $order->refresh();
        });
    }

    public function deletePayment(RepairOrder $order, RepairPayment $payment): RepairOrder
    {
        if ((int) $payment->orden_id !== (int) $order->id || (int) $payment->reparacion !== (int) $order->reparacion) {
            throw new \RuntimeException('La seña no pertenece a esta reparacion.');
        }

        return DB::transaction(function () use ($order, $payment): RepairOrder {
            $isIncrement = $payment->payment_type === 'incremento';
            $amount = (float) $payment->amount;

            $payment->delete();

            if ($isIncrement) {
                $order->forceFill(['monto' => max(0, (float) $order->monto - $amount)])->save();
                $this->recordEvent($order, 'INCREMENTO_ELIMINADO', $order->estado, $order->estado);
            } else {
                $this->syncPaymentTotal($order);
                $this->recordEvent($order, 'SENA_ELIMINADA', $order->estado, $order->estado);
            }

            return $order->refresh();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function metrics(string $period = 'year', ?string $desde = null, ?string $hasta = null): array
    {
        $now = CarbonImmutable::now();
        [$start, $end] = $this->metricWindow($now, $period, $desde, $hasta);
        $profitPercentage = $this->metricProfitPercentage();

        $payload = $this->metricPayload($period, $start, $end, $profitPercentage);
        $previous = $this->metricPrevious($period, $start, $end, $profitPercentage);

        return [
            'period' => $period,
            'window' => [
                'start' => $start?->toDateString(),
                'end' => $end?->toDateString(),
            ],
            'totals' => array_merge($payload['totals'], [
                'openBalance' => $this->metricOpenBalance(),
                'previous' => $previous,
            ]),
            'counts' => $this->metricCounts(),
            'topModels' => $payload['topModels'],
            'topWorkTypes' => $payload['topWorkTypes'],
            'statusBreakdown' => $payload['statusBreakdown'],
            'monthlyBilled' => $payload['monthlyBilled'],
            'monthlyCollected' => $payload['monthlyCollected'],
        ];
    }

    /**
     * Agrega métricas para una ventana; el resultado se cachea para no recalcular en cada request.
     *
     * @return array<string, mixed>
     */
    private function metricPayload(string $period, ?CarbonImmutable $start, ?CarbonImmutable $end, float $profitPercentage): array
    {
        $key = 'repairs.metrics:'.md5($period.'|'.($start?->toDateString() ?? '*').'|'.($end?->toDateString() ?? '*').'|'.$profitPercentage);

        return cache()->remember($key, 60, function () use ($start, $end, $profitPercentage): array {
            $orders = RepairOrder::query()->get();
            $payments = RepairPayment::query()
                ->when($start !== null, fn ($query) => $query->whereDate('paid_at', '>=', $start))
                ->when($end !== null, fn ($query) => $query->whereDate('paid_at', '<=', $end))
                ->get();

            $billed = (float) $this->metricRevenueAttribution($orders, $payments, $start, $end)->sum();
            $collected = (float) $this->metricCollectedAttribution($payments, $start, $end)->sum();
            $realProfit = $this->metricRealProfit($billed, $profitPercentage);

            $revenueOrders = $orders
                ->filter(fn (RepairOrder $order): bool => $this->metricOrderRevenueInWindow($order, $payments, $start, $end) > 0)
                ->values();

            return [
                'totals' => [
                    'billed' => $billed,
                    'collected' => $collected,
                    'collectionRate' => $billed > 0 ? round(($collected / $billed) * 100, 1) : 0,
                    'realProfit' => $realProfit,
                    'margin' => $billed > 0 ? round(($realProfit / $billed) * 100, 1) : 0,
                    'profitPercentage' => $profitPercentage,
                    'averageTicket' => $revenueOrders->count() > 0 ? round($billed / $revenueOrders->count(), 2) : 0,
                    'orderCount' => $revenueOrders->count(),
                ],
                'topModels' => $this->topTextMetric($revenueOrders, 'modelo', $payments, $start, $end),
                'topWorkTypes' => $this->topWorkTypes($revenueOrders, $payments, $start, $end),
                'statusBreakdown' => $revenueOrders
                    ->groupBy(fn (RepairOrder $order): string => (string) ($order->estado ?: 'SIN ESTADO'))
                    ->map(fn (Collection $items, string $label): array => ['label' => $label, 'count' => $items->count()])
                    ->sortByDesc('count')
                    ->values()
                    ->all(),
                'monthlyBilled' => $this->monthlyBilled($start, $end, $orders, $payments),
                'monthlyCollected' => $this->monthlyCollected($start, $end, $payments),
            ];
        });
    }

    private function metricPrevious(string $period, ?CarbonImmutable $start, ?CarbonImmutable $end, float $profitPercentage): ?array
    {
        if ($start === null || $end === null) {
            return null;
        }

        [$prevStart, $prevEnd] = $this->metricPreviousWindow($period, $start, $end);

        if ($prevStart === null || $prevEnd === null) {
            return null;
        }

        return $this->metricPayload($period, $prevStart, $prevEnd, $profitPercentage)['totals'];
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function metricPreviousWindow(string $period, CarbonImmutable $start, CarbonImmutable $end): array
    {
        return match ($period) {
            'year' => [$start->subYear(), $end->subYear()],
            'quarter' => [$start->subQuarter(), $end->subQuarter()],
            'month' => [$start->subMonth(), $end->subMonth()],
            default => $this->metricPreviousCustomWindow($start, $end),
        };
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function metricPreviousCustomWindow(CarbonImmutable $start, CarbonImmutable $end): array
    {
        $days = $start->diffInDays($end);
        $prevEnd = $start->copy()->subDay();
        $prevStart = $prevEnd->copy()->subDays($days);

        return [$prevStart, $prevEnd];
    }

    /**
     * @return array<string, int>
     */
    private function metricCounts(): array
    {
        return [
            'active' => RepairOrder::query()->where('entregado', 'no')->count(),
            'delivered' => RepairOrder::query()->where('entregado', 'si')->count(),
            'cancelled' => RepairOrder::query()->where('estado', 'CANCELADA')->count(),
            'ready' => RepairOrder::query()->where('estado', 'LISTA')->where('entregado', 'no')->count(),
        ];
    }

    private function metricOpenBalance(): float
    {
        return (float) RepairOrder::query()
            ->where('entregado', '!=', 'si')
            ->where('estado', 'LISTA')
            ->get()
            ->sum(fn (RepairOrder $order): float => max(0, (float) $order->monto - (float) $order->senia));
    }

    /**
     * Suma lo realmente cobrado (pagos) agrupado por mes dentro de la ventana.
     *
     * @param Collection<int, RepairPayment> $payments
     * @return Collection<string, float>
     */
    private function metricCollectedAttribution(Collection $payments, ?CarbonImmutable $start, ?CarbonImmutable $end): Collection
    {
        $byMonth = collect();

        foreach ($payments as $payment) {
            $date = $this->metricDate($payment->paid_at);

            if ($date === null || ! $this->metricDateInWindow($date, $start, $end)) {
                continue;
            }

            $amount = max(0, (float) $payment->amount);

            if ($amount <= 0) {
                continue;
            }

            $month = $date->format('Y-m');
            $byMonth->put($month, (float) $byMonth->get($month, 0.0) + $amount);
        }

        return $byMonth;
    }

    /**
     * @param Collection<int, RepairPayment> $payments
     * @return array<int, array{label:string,total:float}>
     */
    private function monthlyCollected(?CarbonImmutable $start, ?CarbonImmutable $end, Collection $payments): array
    {
        $attribution = $this->metricCollectedAttribution($payments, $start, $end);
        $keys = $this->metricMonthKeys($start, $end);

        if ($keys === []) {
            $keys = $attribution->keys()->sort()->values()->all();
        }

        return collect($keys)->map(fn (string $key): array => [
            'label' => $this->monthLabel($key),
            'total' => (float) ($attribution->get($key, 0.0)),
        ])->all();
    }

    private function metricProfitPercentage(): float
    {
        $configured = (float) SiteGlobalConfig::value(self::PROFIT_PERCENT_CONFIG_KEY, (string) self::DEFAULT_PROFIT_PERCENTAGE);

        return min(1000.0, max(0.0, $configured));
    }

    private function metricRealProfit(float $revenue, float $profitPercentage): float
    {
        if ($profitPercentage <= 0) {
            return 0.0;
        }

        return round(max(0, $revenue) * ($profitPercentage / (100 + $profitPercentage)), 2);
    }

    /**
     * @return array{0: ?CarbonImmutable, 1: ?CarbonImmutable}
     */
    private function metricWindow(CarbonImmutable $now, string $period, ?string $desde = null, ?string $hasta = null): array
    {
        if ($period === 'custom') {
            $start = $desde !== null ? ($this->metricDate($desde)?->startOfDay()) : null;
            $end = $hasta !== null ? ($this->metricDate($hasta)?->endOfDay()) : null;

            return [$start, $end];
        }

        return match ($period) {
            'quarter' => [$now->startOfQuarter(), $now->copy()->endOfQuarter()],
            'month' => [$now->startOfMonth(), $now->copy()->endOfMonth()],
            'all' => [null, null],
            default => [$now->startOfYear(), $now->copy()->endOfYear()],
        };
    }

    private function metricDate(mixed $value): ?CarbonImmutable
    {
        if ($value instanceof CarbonImmutable) {
            return $value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function metricDateInWindow(?CarbonImmutable $date, ?CarbonImmutable $start, ?CarbonImmutable $end): bool
    {
        if ($date === null) {
            return false;
        }

        if ($start !== null && $date->lessThan($start)) {
            return false;
        }

        if ($end !== null && $date->greaterThan($end)) {
            return false;
        }

        return true;
    }

    /**
     * @return array<int, string>
     */
    private function metricMonthKeys(?CarbonImmutable $start, ?CarbonImmutable $end): array
    {
        if ($start === null || $end === null) {
            return [];
        }

        $keys = [];
        $cursor = $start->copy()->startOfMonth();
        $last = $end->copy()->startOfMonth();

        while ($cursor->lessThanOrEqualTo($last)) {
            $keys[] = $cursor->format('Y-m');
            $cursor = $cursor->addMonth();
        }

        return $keys;
    }

    /**
     * Distribuye los ingresos reconocidos por mes dentro de la ventana.
     *
     * @param Collection<int, RepairOrder> $orders
     * @param Collection<int, RepairPayment> $payments
     * @return Collection<string, float>
     */
    private function metricRevenueAttribution(Collection $orders, Collection $payments, ?CarbonImmutable $start, ?CarbonImmutable $end): Collection
    {
        $byMonth = collect();
        $add = function (string $month, float $amount) use (&$byMonth): void {
            if ($amount <= 0) {
                return;
            }

            $byMonth->put($month, (float) $byMonth->get($month, 0.0) + $amount);
        };

        $paymentGroups = $this->metricPaymentGroups($payments, $start, $end);

        foreach ($orders as $order) {
            if ($order->entregado === 'si') {
                $date = $this->metricDate($order->fecha_entregado ?? $order->fecha);

                if ($this->metricDateInWindow($date, $start, $end)) {
                    $add($date->format('Y-m'), max(0, (float) $order->monto));
                }

                continue;
            }

            if ($order->estado === 'CANCELADA') {
                continue;
            }

            $key = $order->id . ':' . $order->reparacion;
            $orderPayments = $paymentGroups->get($key, collect());

            if ($orderPayments->isNotEmpty()) {
                foreach ($orderPayments as $payment) {
                    $date = $this->metricDate($payment->paid_at);

                    if ($date !== null) {
                        $add($date->format('Y-m'), max(0, (float) $payment->amount));
                    }
                }

                continue;
            }

            if ((float) $order->senia > 0) {
                $date = $this->metricDate($order->fecha);

                if ($this->metricDateInWindow($date, $start, $end)) {
                    $add($date->format('Y-m'), max(0, (float) $order->senia));
                }
            }
        }

        return $byMonth;
    }

    /**
     * @param Collection<int, RepairPayment> $payments
     */
    private function metricOrderRevenueInWindow(RepairOrder $order, Collection $payments, ?CarbonImmutable $start, ?CarbonImmutable $end): float
    {
        if ($order->entregado === 'si') {
            $date = $this->metricDate($order->fecha_entregado ?? $order->fecha);

            return $this->metricDateInWindow($date, $start, $end) ? max(0, (float) $order->monto) : 0.0;
        }

        if ($order->estado === 'CANCELADA') {
            return 0.0;
        }

        $paymentGroups = $this->metricPaymentGroups($payments, $start, $end);
        $key = $order->id . ':' . $order->reparacion;
        $paymentsTotal = (float) ($paymentGroups->get($key, collect())->sum(fn (RepairPayment $payment): float => (float) $payment->amount));

        if ($paymentsTotal > 0) {
            return $paymentsTotal;
        }

        if ((float) $order->senia > 0) {
            $date = $this->metricDate($order->fecha);

            return $this->metricDateInWindow($date, $start, $end) ? max(0, (float) $order->senia) : 0.0;
        }

        return 0.0;
    }

    /**
     * @param Collection<int, RepairPayment> $payments
     * @return Collection<string, Collection<int, RepairPayment>>
     */
    private function metricPaymentGroups(Collection $payments, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Collection
    {
        return $payments
            ->filter(function (RepairPayment $payment) use ($start, $end): bool {
                if ($payment->payment_type !== 'senia') {
                    return false;
                }

                if ($start === null && $end === null) {
                    return true;
                }

                $date = $this->metricDate($payment->paid_at);

                if ($date === null) {
                    return false;
                }

                if ($start !== null && $date->lessThan($start)) {
                    return false;
                }

                if ($end !== null && $date->greaterThan($end)) {
                    return false;
                }

                return true;
            })
            ->groupBy(fn (RepairPayment $payment): string => $payment->orden_id . ':' . $payment->reparacion);
    }

    private function setState(RepairOrder $order, string $state, string $event, ?string $cancellationReason = null): RepairOrder
    {
        $previousState = $order->estado;
        $updates = [
            'estado' => $state,
        ];

        if (Str::upper($state) === 'CANCELADA') {
            $updates['cancelado_motivo'] = $this->normalizeCancellationReason((string) $cancellationReason);
        } else {
            $updates['cancelado_motivo'] = null;
        }

        $order->update($updates);

        if (Str::upper($state) === 'LISTA') {
            $this->consumeInventoryReservation($order->refresh());
        }
        $this->syncTaskQueueForState($order, $state);

        if ($event !== 'CAMBIO_ESTADO_DIRECTO') {
            $this->recordEvent($order, $event, $previousState, $state);
        }

        return $order->refresh();
    }

    private function normalizeCancellationReason(string $reason): string
    {
        $reason = trim(preg_replace('/\s+/', ' ', $reason) ?? '');

        if ($reason === '') {
            throw new \RuntimeException('Indica el motivo de cancelacion.');
        }

        return Str::limit($reason, 1000, '');
    }

    private function normalizeWarrantyReason(string $reason): string
    {
        $reason = trim(preg_replace('/\s+/', ' ', $reason) ?? '');

        if ($reason === '') {
            throw new \RuntimeException('Indica el motivo de garantia.');
        }

        return Str::limit($reason, 1000, '');
    }

    private function syncTaskQueueForState(RepairOrder $order, string $state): void
    {
        if (! in_array(Str::upper($state), ['LISTA', 'CANCELADA'], true)) {
            return;
        }

        $task = RepairTaskItem::query()
            ->where('repair_order_registro_id', $order->registro_id)
            ->whereNull('completed_at')
            ->oldest('task_date')
            ->oldest('created_at')
            ->oldest('id')
            ->first();

        if ($task === null) {
            return;
        }

        $task->delete();

        $newTask = RepairTaskItem::query()->updateOrCreate(
            [
                'repair_order_registro_id' => $order->registro_id,
                'task_date' => now()->toDateString(),
            ],
            [
                'completed_at' => null,
            ],
        );
        $newTask->forceFill(['created_at' => now(), 'updated_at' => now()])->save();
    }

    public function addOriginalImages(RepairOrder $order, array $images): RepairOrder
    {
        $originalImages = array_slice(array_merge($order->originalImages(), $this->storeImages($images, $order->id, $order->reparacion, 'orig')), 0, 2);

        $order->update([
            'imagen' => implode('|', $originalImages),
        ]);

        return $order->refresh();
    }

    public function removeOriginalImage(RepairOrder $order, string $filename): RepairOrder
    {
        $images = array_values(array_filter($order->originalImages(), fn (string $image): bool => $image !== $filename));

        if (count($images) === count($order->originalImages())) {
            return $order;
        }

        $this->deleteImage($filename);
        $order->update([
            'imagen' => implode('|', $images),
        ]);

        return $order->refresh();
    }

    public function addFinalImages(RepairOrder $order, array $images): RepairOrder
    {
        if (strtoupper($order->estado) !== 'LISTA') {
            return $order;
        }

        $finalImages = array_slice(array_merge($order->finalImages(), $this->storeImages($images, $order->id, $order->reparacion, 'final')), 0, 2);

        $order->update([
            'imagen3' => $finalImages[0] ?? null,
            'imagen4' => $finalImages[1] ?? null,
        ]);

        return $order->refresh();
    }

    public function removeFinalImage(RepairOrder $order, string $filename): RepairOrder
    {
        $images = array_values(array_filter($order->finalImages(), fn (string $image): bool => $image !== $filename));

        if (count($images) === count($order->finalImages())) {
            return $order;
        }

        $this->deleteImage($filename);
        $order->update([
            'imagen3' => $images[0] ?? null,
            'imagen4' => $images[1] ?? null,
        ]);

        return $order->refresh();
    }

    public function summary(array $filters = []): array
    {
        $orders = $this->summaryQuery($filters)->get();
        $unarchivedOrders = $orders->whereNull('archivado_at');

        return [
            'active' => $unarchivedOrders->where('entregado', 'no')->where('estado', '!=', 'CANCELADA')->count(),
            'delivered' => $unarchivedOrders->where('entregado', 'si')->count(),
            'archived' => $orders->whereNotNull('archivado_at')->count(),
            'pending' => $unarchivedOrders->where('entregado', 'no')->where('estado', 'PENDIENTE')->count(),
            'inRepair' => $unarchivedOrders->where('entregado', 'no')->whereIn('estado', ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'])->count(),
            'waitingParts' => $unarchivedOrders
                ->where('entregado', 'no')
                ->where('repuesto_pedido', true)
                ->whereNull('repuesto_pedido_oculto_at')
                ->count(),
            'overdue' => $unarchivedOrders
                ->where('entregado', 'no')
                ->whereIn('estado', ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'])
                ->filter(fn (RepairOrder $order): bool => $order->fecha_estimada !== null && $order->fecha_estimada->lt(now()->startOfDay()))
                ->count(),
            'today' => $unarchivedOrders
                ->where('entregado', 'no')
                ->filter(fn (RepairOrder $order): bool => $order->fecha_estimada !== null && $order->fecha_estimada->isSameDay(now()))
                ->count(),
            'tasks' => count($this->taskQueueRegistroIds()),
            'cancelled' => $unarchivedOrders->where('entregado', 'no')->where('estado', 'CANCELADA')->count(),
            'ready' => $unarchivedOrders->where('entregado', 'no')->where('estado', 'LISTA')->count(),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function availableStates(bool $delivered = false): array
    {
        return $delivered ? self::DELIVERED_STATES : self::ACTIVE_STATES;
    }

    /**
     * @return array<int, array{value:string,label:string,description:string,repuesto:string}>
     */
    public function serviceTemplates(): array
    {
        if (Schema::hasTable('repair_service_options')) {
            return RepairServiceOption::query()
                ->where('type', 'service')
                ->where('active', true)
                ->orderByDesc('usage_count')
                ->orderBy('sort_order')
                ->orderBy('label')
                ->get()
                ->map(fn (RepairServiceOption $option): array => [
                    'value' => $option->value,
                    'label' => $option->label,
                    'description' => $option->description ?? '',
                    'repuesto' => $option->repuesto ?? '',
                ])
                ->values()
                ->all();
        }

        return collect(self::SERVICE_TEMPLATES)
            ->map(fn (array $template, string $value): array => [
                'value' => $value,
                'label' => $template['label'],
                'description' => $template['description'],
                'repuesto' => $template['repuesto'],
            ])
            ->values()
            ->all();
    }

    public function failureTemplates(): array
    {
        if (Schema::hasTable('repair_service_options')) {
            return RepairServiceOption::query()
                ->where('type', 'failure')
                ->where('active', true)
                ->orderByDesc('usage_count')
                ->orderBy('sort_order')
                ->orderBy('label')
                ->get()
                ->map(fn (RepairServiceOption $option): array => [
                    'value' => $option->value,
                    'label' => $option->label,
                    'description' => $option->description ?? '',
                ])
                ->values()
                ->all();
        }

        return collect(self::FAILURE_TEMPLATES)
            ->map(fn (string $description, string $label): array => [
                'value' => Str::slug($label, '_'),
                'label' => $label,
                'description' => $description,
            ])
            ->values()
            ->all();
    }

    private function serviceTemplateByValue(string $value): ?array
    {
        if ($value === '') {
            return null;
        }

        if (Schema::hasTable('repair_service_options')) {
            /** @var RepairServiceOption|null $option */
            $option = RepairServiceOption::query()
                ->where('type', 'service')
                ->where('value', $value)
                ->where('active', true)
                ->first();

            if ($option !== null) {
                return [
                    'label' => $option->label,
                    'description' => $option->description ?? '',
                    'repuesto' => $option->repuesto ?? '',
                ];
            }
        }

        return self::SERVICE_TEMPLATES[$value] ?? null;
    }

    public function serviceOptionUsage(): array
    {
        $usage = [];

        $serviceTemplates = $this->serviceTemplates();
        $failureTemplates = $this->failureTemplates();

        foreach ($serviceTemplates as $template) {
            $usage['service:' . $template['value']] = 0;
        }

        foreach ($failureTemplates as $template) {
            $usage['failure:' . $template['value']] = 0;
        }

        RepairOrder::query()
            ->select(['descripcion', 'repuesto'])
            ->where(function ($query): void {
                $query
                    ->whereNotNull('descripcion')
                    ->orWhereNotNull('repuesto');
            })
            ->chunk(500, function (Collection $orders) use (&$usage, $serviceTemplates, $failureTemplates): void {
                foreach ($orders as $order) {
                    $description = $this->normalizeUsageText((string) $order->descripcion);
                    $part = $this->normalizeUsageText((string) $order->repuesto);

                    foreach ($serviceTemplates as $template) {
                        $templateDescription = $this->normalizeUsageText((string) $template['description']);
                        $templatePart = $this->normalizeUsageText((string) $template['repuesto']);

                        if (
                            ($templateDescription !== '' && str_contains($description, $templateDescription))
                            || ($templatePart !== '' && str_contains($part, $templatePart))
                        ) {
                            $usage['service:' . $template['value']]++;
                        }
                    }

                    foreach ($failureTemplates as $template) {
                        $templateText = $this->normalizeUsageText((string) $template['description']);

                        if ($templateText !== '' && str_contains($description, $templateText)) {
                            $usage['failure:' . $template['value']]++;
                        }
                    }
                }
            });

        if (Schema::hasTable('repair_service_options')) {
            foreach ($usage as $key => $count) {
                [$type, $value] = explode(':', $key, 2);
                RepairServiceOption::query()
                    ->where('type', $type)
                    ->where('value', $value)
                    ->update(['usage_count' => $count]);
            }
        }

        return $usage;
    }

    public function recordEvent(RepairOrder $order, string $event, ?string $previousState, ?string $nextState, ?string $detail = null): void
    {
        RepairEvent::query()->create([
            'orden_id' => $order->id,
            'reparacion' => $order->reparacion,
            'usuario' => auth()->check() ? (string) auth()->user()?->name : (session('repair_tech_authenticated') ? 'panel' : 'sistema'),
            'evento' => $event,
            'detalle' => $detail,
            'estado_anterior' => $previousState,
            'estado_nuevo' => $nextState,
        ]);
    }

    private function baseQuery(bool $delivered, array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $hasSearchTerm = trim((string) ($filters['q'] ?? '')) !== '';
        $query = RepairOrder::query()
            ->whereNull('archivado_at')
            ->when($delivered, fn ($builder) => $builder->where('entregado', 'si'))
            ->when(! $delivered, fn ($builder) => $builder->where('entregado', 'no'))
            ->when(! $delivered, fn ($builder) => $this->applyOrderFilters($builder, $filters))
            ->when($delivered, fn ($builder) => $this->applyDeliveredOrderFilters($builder, $filters));

        $categoryFilter = (int) ($filters['categoria_filter'] ?? 0);

        if (! $hasSearchTerm && $categoryFilter > 0) {
            $query->where('categorias_reparacion', $categoryFilter);
        }

        if (! $hasSearchTerm) {
            $this->applySummaryFilters($query, $filters, false);
        }

        $hasStateFilter = trim((string) ($filters['filter_estado'] ?? '')) !== '';
        $this->applyColumnFilters($query, $filters);

        if (! $hasSearchTerm && ($filters['estado'] ?? '') !== '') {
            $state = (string) $filters['estado'];

            if (in_array($state, ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'], true)) {
                $query->whereIn('estado', ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO']);
            } else {
                $query->where('estado', $state);
            }
        } elseif (! $hasSearchTerm && ! $hasStateFilter && ! $delivered) {
            $query->where('estado', '!=', 'CANCELADA');
        }

        if (! $hasSearchTerm && ($filters['prioridad'] ?? '') === 'vencidas') {
            $query
                ->whereIn('estado', ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'])
                ->whereDate('fecha_estimada', '<', now()->toDateString());
        }

        if (! $hasSearchTerm && ($filters['prioridad'] ?? '') === 'hoy') {
            $query->whereDate('fecha_estimada', now()->toDateString());
        }

        if (! $hasSearchTerm && ($filters['prioridad'] ?? '') === 'tareas') {
            $registroIds = $this->taskQueueRegistroIds();

            $query->whereIn(Schema::hasColumn('ordenes', 'registro_id') ? 'registro_id' : 'id', $registroIds !== [] ? $registroIds : [-1]);
        }

        $this->applyGlobalSearch($query, $filters);

        return $query;
    }

    private function archivedQuery(array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = RepairOrder::query()
            ->whereNotNull('archivado_at');

        $this->applyDeliveredOrderFilters($query, $filters, 'archivado_at');

        $this->applyGlobalSearch($query, $filters);

        if (($filters['estado'] ?? '') !== '') {
            $query->where('estado', (string) $filters['estado']);
        }

        return $query;
    }

    private function applyColumnFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        $likeFilters = [
            'filter_cliente' => 'nombre_cliente',
            'filter_dni' => 'dni',
            'filter_contacto' => 'contacto',
            'filter_modelo' => 'modelo',
            'filter_falla' => 'descripcion',
        ];

        foreach ($likeFilters as $filter => $column) {
            $value = trim((string) ($filters[$filter] ?? ''));

            if ($value !== '') {
                $query->where($column, 'like', '%' . $value . '%');
            }
        }

        $id = trim((string) ($filters['filter_id'] ?? ''));

        if ($id !== '' && ctype_digit($id)) {
            $query->where('id', (int) $id);
        }

        $repairNumber = trim((string) ($filters['filter_trabajo'] ?? ''));

        if ($repairNumber !== '' && ctype_digit($repairNumber)) {
            $query->where('reparacion', (int) $repairNumber);
        }

        $entryDate = trim((string) ($filters['filter_ingreso'] ?? ''));

        if ($entryDate !== '') {
            $query->whereDate('fecha', $entryDate);
        }

        $estimatedDate = trim((string) ($filters['filter_estimada'] ?? ''));

        if ($estimatedDate !== '') {
            $query->whereDate('fecha_estimada', $estimatedDate);
        }

        $balance = trim((string) ($filters['filter_saldo'] ?? ''));

        if ($balance === 'con_senia') {
            $query->where('senia', '>', 0);
        } elseif ($balance === 'sin_senia') {
            $query->where('senia', '<=', 0);
        } elseif ($balance === 'pagado') {
            $query->where('monto', '>', 0)->whereColumn('senia', '>=', 'monto');
        } elseif ($balance !== '' && is_numeric($balance)) {
            $query->whereRaw('(monto - senia) = ?', [(float) $balance]);
        }

        $state = trim((string) ($filters['filter_estado'] ?? ''));

        if ($state !== '') {
            if (in_array($state, ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'], true)) {
                $query->whereIn('estado', ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO']);
            } else {
                $query->where('estado', $state);
            }
        }
    }

    private function applyGlobalSearch(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        $term = trim((string) ($filters['q'] ?? ''));

        if ($term === '') {
            return;
        }

        $activeFields = $this->activeGlobalSearchFields($filters);

        if ($activeFields === []) {
            $query->whereRaw('1 = 0');
            return;
        }

        $search = '%' . $term . '%';
        $numericTerm = ctype_digit($term) ? (int) $term : null;

        $query->where(function ($subQuery) use ($activeFields, $search, $numericTerm): void {
            foreach ($activeFields as $field) {
                switch ($field) {
                    case 'id':
                        $this->applyIdGlobalSearch($subQuery, $search, $numericTerm);
                        break;
                    case 'cliente':
                        $subQuery->orWhere('nombre_cliente', 'like', $search);
                        break;
                    case 'dni':
                        $subQuery->orWhere('dni', 'like', $search);
                        break;
                    case 'contacto':
                        $subQuery->orWhere('contacto', 'like', $search);
                        break;
                    case 'modelo':
                        $subQuery->orWhere('modelo', 'like', $search);
                        break;
                    case 'ingreso':
                        $this->applyDateGlobalSearch($subQuery, 'fecha', $search);
                        break;
                    case 'estimada':
                        $this->applyDateGlobalSearch($subQuery, 'fecha_estimada', $search);
                        break;
                    case 'saldo':
                        $subQuery->orWhereRaw('CAST((monto - senia) AS CHAR) LIKE ?', [$search]);
                        break;
                    case 'estado':
                        $subQuery->orWhere('estado', 'like', $search);
                        break;
                }
            }
        });
    }

    /**
     * @return array<int, string>
     */
    private function activeGlobalSearchFields(array $filters): array
    {
        $fields = $filters['q_fields'] ?? self::GLOBAL_SEARCH_FIELDS;

        if (! is_array($fields)) {
            return self::GLOBAL_SEARCH_FIELDS;
        }

        return array_values(array_intersect(self::GLOBAL_SEARCH_FIELDS, array_map('strval', $fields)));
    }

    private function applyIdGlobalSearch(\Illuminate\Database\Eloquent\Builder $query, string $search, ?int $numericTerm): void
    {
        if ($numericTerm !== null) {
            $query
                ->orWhere('id', $numericTerm)
                ->orWhere('reparacion', $numericTerm);

            if (Schema::hasColumn('ordenes', 'registro_id')) {
                $query->orWhere('registro_id', $numericTerm);
            }

            return;
        }

        $query
            ->orWhereRaw('CAST(id AS CHAR) LIKE ?', [$search])
            ->orWhereRaw('CAST(reparacion AS CHAR) LIKE ?', [$search]);

        if (Schema::hasColumn('ordenes', 'registro_id')) {
            $query->orWhereRaw('CAST(registro_id AS CHAR) LIKE ?', [$search]);
        }
    }

    private function applyDateGlobalSearch(\Illuminate\Database\Eloquent\Builder $query, string $column, string $search): void
    {
        foreach ($this->dateGlobalSearchPatterns($search) as $pattern) {
            $query->orWhere($column, 'like', $pattern);
        }
    }

    /**
     * @return array<int, string>
     */
    private function dateGlobalSearchPatterns(string $search): array
    {
        $term = trim($search, '% ');
        $patterns = ['%' . $term . '%'];

        if (preg_match('/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2}|\d{4}))?$/', $term, $matches) === 1) {
            $day = (int) $matches[1];
            $month = (int) $matches[2];
            $year = $matches[3] ?? null;

            if ($day >= 1 && $day <= 31 && $month >= 1 && $month <= 12) {
                $dayToken = str_pad((string) $day, 2, '0', STR_PAD_LEFT);
                $monthToken = str_pad((string) $month, 2, '0', STR_PAD_LEFT);

                if ($year !== null) {
                    $yearToken = strlen($year) === 2 ? '20' . $year : $year;
                    $patterns[] = '%' . $yearToken . '-' . $monthToken . '-' . $dayToken . '%';
                } else {
                    $patterns[] = '%-' . $monthToken . '-' . $dayToken . '%';
                }
            }
        }

        return array_values(array_unique($patterns));
    }

    private function applyDeliveredOrderFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters, string $dateColumn = 'fecha_entregado'): void
    {
        $direction = strtolower((string) ($filters['orden'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        $query
            ->orderByRaw($dateColumn . ' IS NULL')
            ->orderBy($dateColumn, $direction)
            ->orderBy('id', $direction)
            ->orderBy('reparacion');
    }

    private function applyOrderFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        if (($filters['prioridad'] ?? '') === 'tareas') {
            return;
        }

        $direction = strtolower((string) ($filters['direccion'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        $sort = (string) ($filters['ordenar_por'] ?? 'ticket');

        match ($sort) {
            'ingreso' => $query->orderBy('fecha', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'estimada' => $query->orderByRaw('fecha_estimada IS NULL')->orderBy('fecha_estimada', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'cliente' => $query->orderBy('nombre_cliente', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'dni' => $query->orderBy('dni', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'contacto' => $query->orderBy('contacto', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'trabajo' => $query->orderBy('reparacion', $direction)->orderBy('id', 'desc'),
            'modelo' => $query->orderBy('modelo', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'falla' => $query->orderBy('descripcion', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'estado' => $query->orderBy('estado', $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            'saldo' => $query->orderByRaw('(monto - senia) ' . $direction)->orderBy('id', 'desc')->orderBy('reparacion'),
            default => $query->orderBy('id', $direction)->orderBy('reparacion'),
        };
    }

    /**
     * @return array<int, int>
     */
    private function taskQueueRegistroIds(): array
    {
        $this->completePreviousTerminalTaskItems();

        return RepairTaskItem::query()
            ->whereNull('completed_at')
            ->whereHas('repairOrder', fn ($query) => $query
                ->whereNull('archivado_at')
                ->where('entregado', 'no')
                ->whereNotIn('estado', ['LISTA', 'CANCELADA']))
            ->oldest('task_date')
            ->oldest('created_at')
            ->oldest('id')
            ->pluck('repair_order_registro_id')
            ->map(fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    public function completePreviousTerminalTaskItems(): void
    {
        $today = now()->toDateString();

        RepairTaskItem::query()
            ->whereNull('completed_at')
            ->whereDate('task_date', '<', $today)
            ->whereHas('repairOrder', fn ($query) => $query->whereIn('estado', ['LISTA', 'CANCELADA']))
            ->update(['completed_at' => now()]);
    }

    private function summaryQuery(array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = RepairOrder::query();
        $this->applySummaryFilters($query, $filters, true);

        return $query;
    }

    private function applySummaryFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters, bool $includeCategory): void
    {
        $range = (string) ($filters['summary_range'] ?? 'quarter');

        if (! array_key_exists($range, self::SUMMARY_RANGE_DAYS)) {
            $range = 'quarter';
        }

        if ($range === 'custom') {
            $from = (string) ($filters['summary_from'] ?? '');
            $to = (string) ($filters['summary_to'] ?? '');

            if ($from !== '' && $to !== '' && $from <= $to) {
                $query
                    ->whereDate('fecha', '>=', $from)
                    ->whereDate('fecha', '<=', $to);
            }
        } elseif (self::SUMMARY_RANGE_DAYS[$range] > 0) {
            $query->whereDate('fecha', '>=', now()->subDays(self::SUMMARY_RANGE_DAYS[$range] - 1)->toDateString());
        }

        if (! $includeCategory) {
            return;
        }

        $categoryFilter = (int) ($filters['categoria_filter'] ?? 0);
        if ($categoryFilter > 0) {
            $query->where('categorias_reparacion', $categoryFilter);
        }
    }

    private function trackingTokenForDni(int $dni, ?string $existing = null): ?string
    {
        if ($dni > 0 && $dni !== (int) config('tienda.repair_default_dni')) {
            return null;
        }

        $existing = trim((string) $existing);

        return preg_match('/^\d{5}$/', $existing) === 1 ? $existing : $this->generateTrackingToken();
    }

    private function generateTrackingToken(): string
    {
        return str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }

    private function addInitialPayment(RepairOrder $order, mixed $amount, ?string $method = null): void
    {
        $normalizedMethod = in_array($method, ['efectivo', 'transferencia'], true) ? $method : 'efectivo';
        $maxAmount = $normalizedMethod === 'transferencia' && (float) $order->monto > 30000
            ? round((float) $order->monto * 1.1, 2)
            : (float) $order->monto;
        $amount = min((float) $amount, $maxAmount);

        if ($amount <= 0) {
            return;
        }

        RepairPayment::query()->create([
            'orden_id' => $order->id,
            'reparacion' => $order->reparacion,
            'amount' => $amount,
            'payment_type' => 'senia',
            'method' => $normalizedMethod,
            'notes' => 'Sena inicial',
            'paid_at' => now()->toDateString(),
        ]);

        $this->syncPaymentTotal($order);
    }

    private function paymentTotal(RepairOrder $order): float
    {
        return (float) RepairPayment::query()
            ->where('orden_id', $order->id)
            ->where('reparacion', $order->reparacion)
            ->where('payment_type', 'senia')
            ->sum('amount');
    }

    private function syncPaymentTotal(RepairOrder $order): void
    {
        $order->forceFill(['senia' => $this->paymentTotal($order)])->save();
    }

    /**
     * @param Collection<int, RepairOrder> $orders
     * @param Collection<int, RepairPayment> $payments
     * @return array<int, array{label:string,count:int,total:float}>
     */
    private function topTextMetric(Collection $orders, string $field, Collection $payments, ?CarbonImmutable $start, ?CarbonImmutable $end): array
    {
        return $orders
            ->map(function (RepairOrder $order) use ($field, $payments, $start, $end): array {
                $label = trim((string) ($order->{$field} ?? ''));

                return [
                    'label' => $label !== '' ? Str::upper($label) : 'SIN DATO',
                    'total' => $this->metricOrderRevenueInWindow($order, $payments, $start, $end),
                ];
            })
            ->groupBy('label')
            ->map(fn (Collection $items, string $label): array => [
                'label' => $label,
                'count' => $items->count(),
                'total' => (float) $items->sum('total'),
            ])
            ->sortByDesc('count')
            ->take(8)
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, RepairOrder> $orders
     * @param Collection<int, RepairPayment> $payments
     * @return array<int, array{label:string,count:int,total:float}>
     */
    private function topWorkTypes(Collection $orders, Collection $payments, ?CarbonImmutable $start, ?CarbonImmutable $end): array
    {
        return $orders
            ->map(function (RepairOrder $order) use ($payments, $start, $end): array {
                $text = Str::lower((string) $order->descripcion . ' ' . (string) $order->repuesto);
                $label = match (true) {
                    str_contains($text, 'modulo'), str_contains($text, 'pantalla'), str_contains($text, 'display') => 'Cambio de modulo/pantalla',
                    str_contains($text, 'bateria') => 'Cambio de bateria',
                    str_contains($text, 'pin'), str_contains($text, 'carga') => 'Pin o carga',
                    str_contains($text, 'placa') => 'Trabajo en placa',
                    str_contains($text, 'sistema'), str_contains($text, 'software') => 'Software / sistema',
                    str_contains($text, 'desbloqueo') => 'Desbloqueo',
                    str_contains($text, 'revision'), str_contains($text, 'diagnostico') => 'Revision / diagnostico',
                    default => 'Otros trabajos',
                };

                return ['label' => $label, 'total' => $this->metricOrderRevenueInWindow($order, $payments, $start, $end)];
            })
            ->groupBy('label')
            ->map(fn (Collection $items, string $label): array => [
                'label' => $label,
                'count' => $items->count(),
                'total' => (float) $items->sum('total'),
            ])
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    /**
     * @param Collection<int, RepairOrder> $orders
     * @param Collection<int, RepairPayment> $payments
     * @return array<int, array{label:string,total:float}>
     */
    private function monthlyBilled(?CarbonImmutable $start, ?CarbonImmutable $end, Collection $orders, Collection $payments): array
    {
        $attribution = $this->metricRevenueAttribution($orders, $payments, $start, $end);
        $keys = $this->metricMonthKeys($start, $end);

        if ($keys === []) {
            $keys = $attribution->keys()->sort()->values()->all();
        }

        return collect($keys)->map(fn (string $key): array => [
            'label' => $this->monthLabel($key),
            'total' => (float) ($attribution->get($key, 0.0)),
        ])->all();
    }

    private function monthLabel(string $key): string
    {
        try {
            return CarbonImmutable::createFromFormat('Y-m', $key)->locale('es')->isoFormat('MMM');
        } catch (\Throwable) {
            return $key;
        }
    }

    /**
     * @param array<int, UploadedFile> $images
     * @return array<int, string>
     */
    private function storeImages(array $images, int $orderId, int $repairNumber, string $prefix): array
    {
        $stored = [];
        $uploadDirectory = public_path((string) config('tienda.uploads.repairs'));
        $thumbDirectory = public_path((string) config('tienda.uploads.repairs_thumbnails'));

        File::ensureDirectoryExists($uploadDirectory);
        File::ensureDirectoryExists($thumbDirectory);

        foreach ($images as $index => $image) {
            if (! $image instanceof UploadedFile) {
                continue;
            }

            $extension = $image->getClientOriginalExtension() !== '' ? $image->getClientOriginalExtension() : 'jpg';
            $filename = sprintf(
                'orden_%d_%d_%s_%d_%s.%s',
                $orderId,
                $repairNumber,
                $prefix,
                $index + 1,
                Str::lower(Str::random(8)),
                $extension,
            );

            $image->move($uploadDirectory, $filename);
            File::copy($uploadDirectory . DIRECTORY_SEPARATOR . $filename, $thumbDirectory . DIRECTORY_SEPARATOR . 'thumb_' . $filename);

            $stored[] = $filename;
        }

        return $stored;
    }

    private function deleteImage(string $filename): void
    {
        $paths = [
            public_path((string) config('tienda.uploads.repairs') . DIRECTORY_SEPARATOR . $filename),
            public_path((string) config('tienda.uploads.repairs_thumbnails') . DIRECTORY_SEPARATOR . 'thumb_' . $filename),
        ];

        foreach ($paths as $path) {
            if (File::exists($path)) {
                File::delete($path);
            }
        }
    }

    private function hasMeaningfulCommentChange(?string $before, ?string $after): bool
    {
        $normalize = static function (?string $value): string {
            $trimmed = trim((string) $value);

            if ($trimmed === '') {
                return '';
            }

            return Str::lower(preg_replace('/\s+/', ' ', $trimmed) ?? '');
        };

        $beforeValue = $normalize($before);
        $afterValue = $normalize($after);

        return $beforeValue !== $afterValue && !in_array($afterValue, ['', 'sin observaciones', 'sin observacion'], true);
    }

    private function rememberDeviceModel(mixed $model, int $categoryId, mixed $brand = null): ?string
    {
        $model = trim((string) $model);
        $normalizedBrand = $this->normalizeDeviceModel((string) $brand);
        $originalNormalized = $this->normalizeDeviceModel($model);
        $normalized = $this->stripBrandFromModel($originalNormalized, $normalizedBrand);

        if ($model === '' || $normalized === '' || ! Schema::hasTable('repair_device_models')) {
            return $normalized !== '' ? $normalized : null;
        }

        $categoryId = max(1, $categoryId);

        /** @var RepairDeviceModel|null $deviceModel */
        $deviceModel = RepairDeviceModel::query()
            ->where('category_id', $categoryId)
            ->where('normalized_model', $normalized)
            ->lockForUpdate()
            ->first();

        if ($deviceModel !== null) {
            $deviceModel->increment('usage_count');

            return $deviceModel->model;
        }

        /** @var RepairDeviceModel|null $legacyDeviceModel */
        $legacyDeviceModel = RepairDeviceModel::query()
            ->where('category_id', $categoryId)
            ->where('normalized_model', $originalNormalized)
            ->lockForUpdate()
            ->first();

        if ($legacyDeviceModel !== null) {
            $legacyDeviceModel->update([
                'brand' => $this->detectDeviceBrand($originalNormalized, $normalizedBrand),
                'model' => $normalized,
                'normalized_model' => $normalized,
                'usage_count' => $legacyDeviceModel->usage_count + 1,
            ]);

            return $normalized;
        }

        RepairDeviceModel::query()->create([
            'category_id' => $categoryId,
            'brand' => $this->detectDeviceBrand($model, $normalizedBrand),
            'model' => $normalized,
            'normalized_model' => $normalized,
            'usage_count' => 1,
        ]);

        return $normalized;
    }

    private function normalizeDeviceModel(string $model): string
    {
        $value = Str::ascii(Str::upper($model));
        $value = preg_replace('/[^A-Z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function stripBrandFromModel(string $model, string $brand = ''): string
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

    private function detectDeviceBrand(string $model, string $brand = ''): ?string
    {
        if ($brand !== '' && $brand !== 'OTRAS') {
            return $brand;
        }

        $normalized = $this->normalizeDeviceModel($model);

        foreach (['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'] as $brand) {
            if ($normalized === $brand || str_starts_with($normalized, $brand . ' ')) {
                return $brand;
            }
        }

        return null;
    }

    private function detectDeviceBrandFromRepairText(string $model, string $description = '', string $brand = ''): ?string
    {
        $normalizedBrand = $this->normalizeDeviceModel($brand);
        $detected = $this->detectDeviceBrand($model, $normalizedBrand);

        if ($detected !== null) {
            return $detected;
        }

        $normalizedDescription = $this->normalizeDeviceModel($description);
        $normalizedModel = $this->normalizeDeviceModel($model);

        foreach (['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'] as $knownBrand) {
            if ($normalizedDescription === $knownBrand || str_ends_with($normalizedDescription, ' ' . $knownBrand)) {
                return $knownBrand;
            }

            if ($normalizedModel !== '' && str_ends_with($normalizedDescription, ' ' . $knownBrand . ' ' . $normalizedModel)) {
                return $knownBrand;
            }
        }

        return null;
    }

    private function normalizeUsageText(string $value): string
    {
        $value = Str::ascii(Str::lower($value));
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? '';

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function uppercaseFailure(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', Str::upper($value)) ?? '');
    }

    private function normalizeRepairSuggestionType(string $value): string
    {
        $lines = preg_split('/\R+/', $value) ?: [];

        foreach ($lines as $line) {
            $normalized = $this->normalizeDeviceModel($line);

            if ($normalized !== '') {
                return $normalized;
            }
        }

        return '';
    }

    /**
     * @return array<int, array{
     *     modelo:?string,
     *     marca:?string,
     *     color:?string,
     *     descripcion:string,
     *     observaciones:string,
     *     monto:float|int,
     *     senia:float|int,
     *     senia_method:?string,
     *     fecha_estimada:?string,
     *     estado:string,
     *     repuesto:?string,
     *     pedir_repuesto:bool,
     *     inventory_part_id:int,
     *     repuesto_agregados:array<int, string>,
     *     repuesto_agregado_otro:?string,
     *     categorias_reparacion:int,
     *     unlock_type:?string,
     *     unlock_value:?string
     * }>
     */
    private function normalizeJobs(array $payload): array
    {
        $jobs = collect($payload['jobs'] ?? [Arr::only($payload, [
            'modelo',
            'color',
            'tipo_servicio',
            'descripcion',
            'observaciones',
            'monto',
            'senia',
            'senia_method',
            'fecha_estimada',
            'estado',
            'repuesto',
            'repuesto_agregados',
            'repuesto_agregado_otro',
            'inventory_part_id',
            'categorias_reparacion',
            'unlock_type',
            'unlock_value',
        ])])
            ->filter(fn ($job): bool => is_array($job))
            ->map(function (array $job): array {
                $serviceType = trim((string) ($job['tipo_servicio'] ?? ''));
                $template = $this->serviceTemplateByValue($serviceType);
                $brand = $this->normalizeDeviceModel((string) ($job['marca'] ?? ''));
                $model = trim((string) ($job['modelo'] ?? ''));
                $description = trim((string) ($job['descripcion'] ?? ''));
                $fallbackDescription = trim((string) ($template['description'] ?? ''));
                $shouldRequestPart = filter_var($job['pedir_repuesto'] ?? false, FILTER_VALIDATE_BOOL);
                $part = trim((string) ($job['repuesto'] ?? ''));
                $inventoryPartId = max(0, (int) ($job['inventory_part_id'] ?? 0));
                $categoryId = max(1, (int) ($job['categorias_reparacion'] ?? 4));
                $unlock = $this->normalizeUnlockData($job, $categoryId);
                $partAccessories = $this->normalizePartAccessories($job, $categoryId);

                if ($description === '' && $fallbackDescription !== '') {
                    $description = $fallbackDescription;
                }

                $state = (string) ($job['estado'] ?? 'PENDIENTE');
                if (! $shouldRequestPart && $state === 'EN REPARACION / ESPERA REPUESTO') {
                    $state = 'PENDIENTE';
                }

                return [
                    'modelo' => $model !== '' ? $model : null,
                    'marca' => $brand !== '' ? $brand : null,
                    'color' => trim((string) ($job['color'] ?? '')) !== '' ? trim((string) $job['color']) : null,
                    'descripcion' => $this->uppercaseFailure($description),
                    'observaciones' => trim((string) ($job['observaciones'] ?? '')) !== '' ? trim((string) ($job['observaciones'] ?? '')) : 'sin observaciones',
                    'monto' => $job['monto'] ?? 0,
                    'senia' => $job['senia'] ?? 0,
                    'senia_method' => $job['senia_method'] ?? null,
                    'fecha_estimada' => $job['fecha_estimada'] ?? null,
                    'estado' => $state,
                    'repuesto' => ($shouldRequestPart || $inventoryPartId > 0) && $part !== '' ? $part : null,
                    'pedir_repuesto' => $shouldRequestPart,
                    'inventory_part_id' => $inventoryPartId,
                    'repuesto_agregados' => $partAccessories['items'],
                    'repuesto_agregado_otro' => $partAccessories['other'],
                    'categorias_reparacion' => $categoryId,
                    'unlock_type' => $unlock['type'],
                    'unlock_value' => $unlock['value'],
                ];
            })
            ->filter(fn (array $job): bool => trim((string) $job['descripcion']) !== '')
            ->values()
            ->all();

        if ($jobs === []) {
            $description = trim((string) ($payload['descripcion'] ?? ''));

            if ($description === '') {
                throw new \RuntimeException('Completa el tipo de servicio o descripcion de la falla.');
            }

            $shouldRequestPart = filter_var($payload['pedir_repuesto'] ?? false, FILTER_VALIDATE_BOOL);
            $part = trim((string) ($payload['repuesto'] ?? ''));
            $inventoryPartId = max(0, (int) ($payload['inventory_part_id'] ?? 0));
            $categoryId = max(1, (int) ($payload['categorias_reparacion'] ?? 4));
            $unlock = $this->normalizeUnlockData($payload, $categoryId);
            $partAccessories = $this->normalizePartAccessories($payload, $categoryId);

            return [[
                'modelo' => trim((string) ($payload['modelo'] ?? '')) !== '' ? trim((string) $payload['modelo']) : null,
                'marca' => $this->normalizeDeviceModel((string) ($payload['marca'] ?? '')) ?: null,
                'color' => trim((string) ($payload['color'] ?? '')) !== '' ? trim((string) $payload['color']) : null,
                'descripcion' => $this->uppercaseFailure($description),
                'observaciones' => trim((string) ($payload['observaciones'] ?? '')) !== '' ? trim((string) $payload['observaciones']) : 'sin observaciones',
                'monto' => $payload['monto'] ?? 0,
                'senia' => $payload['senia'] ?? 0,
                'senia_method' => $payload['senia_method'] ?? null,
                'fecha_estimada' => $payload['fecha_estimada'] ?? null,
                'estado' => ! $shouldRequestPart && ($payload['estado'] ?? null) === 'EN REPARACION / ESPERA REPUESTO' ? 'PENDIENTE' : ($payload['estado'] ?? 'PENDIENTE'),
                'repuesto' => ($shouldRequestPart || $inventoryPartId > 0) && $part !== '' ? $part : null,
                'pedir_repuesto' => $shouldRequestPart,
                'inventory_part_id' => $inventoryPartId,
                'repuesto_agregados' => $partAccessories['items'],
                'repuesto_agregado_otro' => $partAccessories['other'],
                'categorias_reparacion' => $categoryId,
                'unlock_type' => $unlock['type'],
                'unlock_value' => $unlock['value'],
            ]];
        }

        return $jobs;
    }

    /**
     * @return array{items:array<int, string>,other:?string}
     */
    private function normalizePartAccessories(array $payload, int $categoryId): array
    {
        if ($categoryId !== 1) {
            return ['items' => [], 'other' => null];
        }

        $allowed = ['funda', 'sim', 'memoria', 'sin_porta_chip', 'otro'];
        $items = collect($payload['repuesto_agregados'] ?? [])
            ->filter(fn ($item): bool => is_string($item))
            ->map(fn (string $item): string => Str::lower(trim($item)))
            ->filter(fn (string $item): bool => in_array($item, $allowed, true))
            ->unique()
            ->values()
            ->all();
        $other = trim((string) ($payload['repuesto_agregado_otro'] ?? ''));

        return [
            'items' => $items,
            'other' => in_array('otro', $items, true) && $other !== '' ? $other : null,
        ];
    }

    /**
     * @return array{type:?string,value:?string}
     */
    private function normalizeUnlockData(array $payload, int $categoryId): array
    {
        if ($categoryId !== 1) {
            return ['type' => null, 'value' => null];
        }

        $type = trim((string) ($payload['unlock_type'] ?? ''));
        if (! in_array($type, ['pin', 'pattern'], true)) {
            return ['type' => null, 'value' => null];
        }

        $value = trim((string) ($payload['unlock_value'] ?? ''));
        if ($type === 'pattern') {
            $points = collect(preg_split('/[^1-9]+/', $value) ?: [])
                ->filter(fn (string $point): bool => $point !== '')
                ->unique()
                ->values()
                ->all();

            $value = implode('-', $points);
        }

        if ($value === '') {
            return ['type' => null, 'value' => null];
        }

        return ['type' => $type, 'value' => Str::limit($value, 80, '')];
    }
}
