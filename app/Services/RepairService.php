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
                'estado' => $payload['estado'] ?? $order->estado,
                'fecha_entregado' => $payload['fecha_entregado'] ?? $order->fecha_entregado,
                'repuesto' => ($activePartRequest || $allocation !== null) && $part !== '' ? $part : null,
                'repuesto_pedido' => $activePartRequest,
                'repuesto_pedido_at' => $activePartRequest ? ($order->repuesto_pedido_at ?? now()) : null,
                'repuesto_pedido_oculto_at' => $activePartRequest ? null : $order->repuesto_pedido_oculto_at,
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

    public function updateState(RepairOrder $order, string $state): RepairOrder
    {
        return $this->setState($order, $state, 'CAMBIO_ESTADO_DIRECTO');
    }

    public function cancel(RepairOrder $order): RepairOrder
    {
        $cancelled = $this->setState($order, 'CANCELADA', 'CANCELADA');

        return $this->archive($cancelled, 'cancelada');
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
    public function metrics(): array
    {
        $now = CarbonImmutable::now();
        $yearStart = $now->startOfYear();
        $quarterStart = $now->startOfQuarter();
        $monthStart = $now->startOfMonth();

        $orders = RepairOrder::query()->get();
        $payments = RepairPayment::query()->get();
        $paymentGroups = $this->metricPaymentGroups($payments);
        $revenueOrders = $orders->filter(fn (RepairOrder $order): bool => $this->metricOrderRevenue($order, $paymentGroups) > 0);
        $totalRevenue = $this->metricRevenueTotal($orders, $payments);
        $totalPaid = $totalRevenue;
        $profitPercentage = $this->metricProfitPercentage();
        $yearRevenue = $this->metricRevenueTotal($orders, $payments, $yearStart);
        $quarterRevenue = $this->metricRevenueTotal($orders, $payments, $quarterStart);
        $monthRevenue = $this->metricRevenueTotal($orders, $payments, $monthStart);

        return [
            'totals' => [
                'yearBilled' => $yearRevenue,
                'quarterBilled' => $quarterRevenue,
                'monthBilled' => $monthRevenue,
                'yearPaid' => $yearRevenue,
                'quarterPaid' => $quarterRevenue,
                'monthPaid' => $monthRevenue,
                'profitPercentage' => $profitPercentage,
                'yearRealProfit' => $this->metricRealProfit($yearRevenue, $profitPercentage),
                'quarterRealProfit' => $this->metricRealProfit($quarterRevenue, $profitPercentage),
                'monthRealProfit' => $this->metricRealProfit($monthRevenue, $profitPercentage),
                'openBalance' => (float) $orders
                    ->filter(fn (RepairOrder $order): bool => $order->entregado !== 'si' && $order->estado === 'LISTA' && $order->estado !== 'CANCELADA')
                    ->sum(fn (RepairOrder $order): float => max(0, (float) $order->monto - (float) $order->senia)),
                'averageTicket' => $revenueOrders->count() > 0 ? round($totalRevenue / $revenueOrders->count(), 2) : 0,
                'collectionRate' => $totalRevenue > 0 ? round(($totalPaid / $totalRevenue) * 100, 1) : 0,
            ],
            'counts' => [
                'active' => $orders->where('entregado', 'no')->count(),
                'delivered' => $orders->where('entregado', 'si')->count(),
                'cancelled' => $orders->where('estado', 'CANCELADA')->count(),
                'ready' => $orders->where('estado', 'LISTA')->where('entregado', 'no')->count(),
            ],
            'topModels' => $this->topTextMetric($revenueOrders, 'modelo', $paymentGroups),
            'topWorkTypes' => $this->topWorkTypes($revenueOrders, $paymentGroups),
            'statusBreakdown' => $orders
                ->groupBy(fn (RepairOrder $order): string => (string) ($order->estado ?: 'SIN ESTADO'))
                ->map(fn (Collection $items, string $label): array => ['label' => $label, 'count' => $items->count()])
                ->sortByDesc('count')
                ->values()
                ->all(),
            'monthlyBilled' => $this->monthlyBilled($yearStart, $orders, $payments),
        ];
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

    private function metricRevenueTotal(Collection $orders, Collection $payments, ?CarbonImmutable $since = null): float
    {
        $paymentGroups = $this->metricPaymentGroups($payments, $since);

        return (float) $orders->sum(function (RepairOrder $order) use ($paymentGroups, $since): float {
            if ($order->entregado === 'si') {
                $deliveredDate = $order->fecha_entregado ?? $order->fecha;

                if ($since !== null && optional($deliveredDate)->format('Y-m-d') < $since->toDateString()) {
                    return 0;
                }

                return (float) $order->monto;
            }

            if ($order->estado === 'CANCELADA') {
                return 0;
            }

            $key = $order->id . ':' . $order->reparacion;
            $paymentsTotal = (float) ($paymentGroups->get($key, collect())->sum(fn (RepairPayment $payment): float => (float) $payment->amount));

            if ($since === null) {
                return max($paymentsTotal, (float) $order->senia);
            }

            if ($paymentsTotal > 0) {
                return $paymentsTotal;
            }

            return optional($order->fecha)->format('Y-m-d') >= $since->toDateString() ? (float) $order->senia : 0;
        });
    }

    /**
     * @param Collection<int, RepairPayment> $payments
     * @return Collection<string, Collection<int, RepairPayment>>
     */
    private function metricPaymentGroups(Collection $payments, ?CarbonImmutable $since = null): Collection
    {
        return $payments
            ->filter(function (RepairPayment $payment) use ($since): bool {
                if ($payment->payment_type !== 'senia') {
                    return false;
                }

                if ($since === null) {
                    return true;
                }

                return optional($payment->paid_at)->format('Y-m-d') >= $since->toDateString();
            })
            ->groupBy(fn (RepairPayment $payment): string => $payment->orden_id . ':' . $payment->reparacion);
    }

    /**
     * @param Collection<string, Collection<int, RepairPayment>> $paymentGroups
     */
    private function metricOrderRevenue(RepairOrder $order, Collection $paymentGroups): float
    {
        if ($order->entregado === 'si') {
            return max(0, (float) $order->monto);
        }

        if ($order->estado === 'CANCELADA') {
            return 0;
        }

        $key = $order->id . ':' . $order->reparacion;
        $paymentsTotal = (float) ($paymentGroups->get($key, collect())->sum(fn (RepairPayment $payment): float => (float) $payment->amount));

        return max($paymentsTotal, (float) $order->senia, 0);
    }

    private function setState(RepairOrder $order, string $state, string $event): RepairOrder
    {
        $previousState = $order->estado;

        $order->update([
            'estado' => $state,
        ]);

        if (Str::upper($state) === 'LISTA') {
            $this->consumeInventoryReservation($order->refresh());
        }
        $this->syncTaskQueueForState($order, $state);

        if ($event !== 'CAMBIO_ESTADO_DIRECTO') {
            $this->recordEvent($order, $event, $previousState, $state);
        }

        return $order->refresh();
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

    public function recordEvent(RepairOrder $order, string $event, ?string $previousState, ?string $nextState): void
    {
        RepairEvent::query()->create([
            'orden_id' => $order->id,
            'reparacion' => $order->reparacion,
                'usuario' => auth()->check() ? (string) auth()->user()?->name : (session('repair_tech_authenticated') ? 'panel' : 'sistema'),
            'evento' => $event,
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
     * @return array<int, array{label:string,count:int,total:float}>
     */
    private function topTextMetric(Collection $orders, string $field, Collection $paymentGroups): array
    {
        return $orders
            ->map(function (RepairOrder $order) use ($field, $paymentGroups): array {
                $label = trim((string) ($order->{$field} ?? ''));

                return [
                    'label' => $label !== '' ? Str::upper($label) : 'SIN DATO',
                    'total' => $this->metricOrderRevenue($order, $paymentGroups),
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
     * @return array<int, array{label:string,count:int,total:float}>
     */
    private function topWorkTypes(Collection $orders, Collection $paymentGroups): array
    {
        return $orders
            ->map(function (RepairOrder $order) use ($paymentGroups): array {
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

                return ['label' => $label, 'total' => $this->metricOrderRevenue($order, $paymentGroups)];
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
     * @return array<int, array{label:string,total:float}>
     */
    private function monthlyBilled(CarbonImmutable $yearStart, Collection $orders, Collection $payments): array
    {
        $paymentGroups = $this->metricPaymentGroups($payments);
        $rows = collect(range(1, 12))->mapWithKeys(fn (int $month): array => [str_pad((string) $month, 2, '0', STR_PAD_LEFT) => 0.0]);

        foreach ($orders as $order) {
            if ($order->entregado === 'si') {
                $date = $order->fecha_entregado ?? $order->fecha;

                if (optional($date)->format('Y') === (string) $yearStart->year) {
                    $month = optional($date)->format('m') ?: '00';
                    $rows[$month] = (float) $rows[$month] + max(0, (float) $order->monto);
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
                    if (optional($payment->paid_at)->format('Y') !== (string) $yearStart->year) {
                        continue;
                    }

                    $month = optional($payment->paid_at)->format('m') ?: '00';
                    $rows[$month] = (float) $rows[$month] + max(0, (float) $payment->amount);
                }

                continue;
            }

            if ((float) $order->senia > 0 && optional($order->fecha)->format('Y') === (string) $yearStart->year) {
                $month = optional($order->fecha)->format('m') ?: '00';
                $rows[$month] = (float) $rows[$month] + max(0, (float) $order->senia);
            }
        }

        return collect(range(1, 12))
            ->map(fn (int $month): array => [
                'label' => CarbonImmutable::create($yearStart->year, $month, 1)->locale('es')->isoFormat('MMM'),
                'total' => (float) ($rows->get(str_pad((string) $month, 2, '0', STR_PAD_LEFT), 0)),
            ])
            ->all();
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
                'categorias_reparacion' => $categoryId,
                'unlock_type' => $unlock['type'],
                'unlock_value' => $unlock['value'],
            ]];
        }

        return $jobs;
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
