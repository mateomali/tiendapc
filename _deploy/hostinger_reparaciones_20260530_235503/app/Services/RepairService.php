<?php

namespace App\Services;

use App\Models\RepairEvent;
use App\Models\RepairOrder;
use App\Models\RepairPayment;
use App\Models\RepairPart;
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
        return $this->baseQuery(false, $filters)->get();
    }

    public function deliveredOrders(array $filters = []): Collection
    {
        return $this->baseQuery(true, $filters)->get();
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

            foreach ($jobs as $index => $job) {
                $repairNumber = $index + 1;
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
                    'modelo' => $job['modelo'],
                    'descripcion' => $job['descripcion'],
                    'observaciones' => $job['observaciones'],
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

                $this->addInitialPayment($order, $job['senia']);
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
                'modelo' => $payload['modelo'] ?? null,
                'descripcion' => $payload['descripcion'],
                'observaciones' => $payload['observaciones'] ?? 'sin observaciones',
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

            $this->addInitialPayment($repair, $payload['senia'] ?? 0);
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

            RepairOrder::query()
                ->where('id', $newOrderId)
                ->update([
                    'nombre_cliente' => $payload['nombre_cliente'],
                    'dni' => $dni,
                    'tracking_token' => $trackingToken,
                    'contacto' => $payload['contacto'] ?? null,
                    'fecha' => $payload['fecha'] ?? $order->fecha,
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

            $order->fill([
                'id' => $newOrderId,
                'nombre_cliente' => $payload['nombre_cliente'],
                'dni' => $dni,
                'tracking_token' => $trackingToken,
                'contacto' => $payload['contacto'] ?? null,
                'fecha' => $payload['fecha'] ?? $order->fecha,
                'modelo' => $payload['modelo'] ?? null,
                'descripcion' => $payload['descripcion'] ?? null,
                'observaciones' => $payload['observaciones'] ?? 'sin observaciones',
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

            $this->recordEvent($order, $order->entregado === 'si' ? 'ACTUALIZADA_ENTREGADA' : 'ACTUALIZADA', $previousState, $order->estado);

            if ($previousState !== $order->estado) {
                $this->recordEvent($order, 'CAMBIO_ESTADO', $previousState, $order->estado);
            }

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
        return $this->setState($order, 'CANCELADA', 'CANCELADA');
    }

    public function deliver(RepairOrder $order, ?string $date = null, ?string $via = null, ?string $detail = null): RepairOrder
    {
        $previousState = $order->estado;
        $updates = [
            'entregado' => 'si',
            'fecha_entregado' => $date ?: now()->toDateString(),
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
            'estado' => 'PENDIENTE',
        ]);

        $this->recordEvent($order, 'MOVER_A_CONSULTAS', $previousState, 'PENDIENTE');

        return $order->refresh();
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
            RepairPayment::query()->create([
                'orden_id' => $order->id,
                'reparacion' => $order->reparacion,
                'amount' => (float) $payload['amount'],
                'payment_type' => 'senia',
                'method' => $payload['method'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'paid_at' => $payload['paid_at'] ?? now()->toDateString(),
            ]);

            $this->syncPaymentTotal($order);
            $this->recordEvent($order, 'PAGO_REGISTRADO', $order->estado, $order->estado);

            return $order->refresh();
        });
    }

    public function deletePayment(RepairOrder $order, RepairPayment $payment): RepairOrder
    {
        if ((int) $payment->orden_id !== (int) $order->id || (int) $payment->reparacion !== (int) $order->reparacion) {
            throw new \RuntimeException('La seña no pertenece a esta reparacion.');
        }

        return DB::transaction(function () use ($order, $payment): RepairOrder {
            $payment->delete();
            $this->syncPaymentTotal($order);
            $this->recordEvent($order, 'SENA_ELIMINADA', $order->estado, $order->estado);

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

        $billableQuery = fn () => RepairOrder::query()
            ->whereNotIn('estado', ['CANCELADA'])
            ->where('monto', '>', 0);

        $paymentsQuery = fn () => RepairPayment::query();

        $orders = RepairOrder::query()->get();
        $billableOrders = $orders->filter(fn (RepairOrder $order): bool => $order->estado !== 'CANCELADA' && (float) $order->monto > 0);
        $totalBilled = (float) $billableOrders->sum(fn (RepairOrder $order): float => (float) $order->monto);
        $totalPaid = (float) RepairPayment::query()->sum('amount');

        return [
            'totals' => [
                'yearBilled' => (float) $billableQuery()->whereDate('fecha', '>=', $yearStart->toDateString())->sum('monto'),
                'quarterBilled' => (float) $billableQuery()->whereDate('fecha', '>=', $quarterStart->toDateString())->sum('monto'),
                'monthBilled' => (float) $billableQuery()->whereDate('fecha', '>=', $monthStart->toDateString())->sum('monto'),
                'yearPaid' => (float) $paymentsQuery()->whereDate('paid_at', '>=', $yearStart->toDateString())->sum('amount'),
                'quarterPaid' => (float) $paymentsQuery()->whereDate('paid_at', '>=', $quarterStart->toDateString())->sum('amount'),
                'monthPaid' => (float) $paymentsQuery()->whereDate('paid_at', '>=', $monthStart->toDateString())->sum('amount'),
                'openBalance' => (float) $orders
                    ->filter(fn (RepairOrder $order): bool => $order->entregado !== 'si' && $order->estado !== 'CANCELADA')
                    ->sum(fn (RepairOrder $order): float => max(0, (float) $order->monto - (float) $order->senia)),
                'averageTicket' => $billableOrders->count() > 0 ? round($totalBilled / $billableOrders->count(), 2) : 0,
                'collectionRate' => $totalBilled > 0 ? round(($totalPaid / $totalBilled) * 100, 1) : 0,
            ],
            'counts' => [
                'active' => $orders->where('entregado', 'no')->count(),
                'delivered' => $orders->where('entregado', 'si')->count(),
                'cancelled' => $orders->where('estado', 'CANCELADA')->count(),
                'ready' => $orders->where('estado', 'LISTA')->where('entregado', 'no')->count(),
            ],
            'topModels' => $this->topTextMetric($billableOrders, 'modelo'),
            'topWorkTypes' => $this->topWorkTypes($billableOrders),
            'statusBreakdown' => $orders
                ->groupBy(fn (RepairOrder $order): string => (string) ($order->estado ?: 'SIN ESTADO'))
                ->map(fn (Collection $items, string $label): array => ['label' => $label, 'count' => $items->count()])
                ->sortByDesc('count')
                ->values()
                ->all(),
            'monthlyBilled' => $this->monthlyBilled($yearStart),
        ];
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

        $this->recordEvent($order, $event, $previousState, $state);

        if ($previousState !== $state) {
            $this->recordEvent($order, 'CAMBIO_ESTADO', $previousState, $state);
        }

        return $order->refresh();
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

        return [
            'active' => $orders->where('entregado', 'no')->where('estado', '!=', 'CANCELADA')->count(),
            'delivered' => $orders->where('entregado', 'si')->count(),
            'pending' => $orders->where('entregado', 'no')->where('estado', 'PENDIENTE')->count(),
            'inRepair' => $orders->where('entregado', 'no')->whereIn('estado', ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'])->count(),
            'waitingParts' => $orders
                ->where('entregado', 'no')
                ->where('repuesto_pedido', true)
                ->whereNull('repuesto_pedido_oculto_at')
                ->count(),
            'overdue' => $orders
                ->where('entregado', 'no')
                ->whereIn('estado', ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'])
                ->filter(fn (RepairOrder $order): bool => $order->fecha_estimada !== null && $order->fecha_estimada->lt(now()->startOfDay()))
                ->count(),
            'today' => $orders
                ->where('entregado', 'no')
                ->filter(fn (RepairOrder $order): bool => $order->fecha_estimada !== null && $order->fecha_estimada->isSameDay(now()))
                ->count(),
            'cancelled' => $orders->where('entregado', 'no')->where('estado', 'CANCELADA')->count(),
            'ready' => $orders->where('entregado', 'no')->where('estado', 'LISTA')->count(),
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
        $query = RepairOrder::query()
            ->when($delivered, fn ($builder) => $builder->where('entregado', 'si'))
            ->when(! $delivered, fn ($builder) => $builder->where('entregado', 'no'))
            ->when(! $delivered, fn ($builder) => $this->applyOrderFilters($builder, $filters))
            ->when($delivered, fn ($builder) => $this->applyDeliveredOrderFilters($builder, $filters));

        $categoryFilter = (int) ($filters['categoria_filter'] ?? 0);

        if ($categoryFilter > 0) {
            $query->where('categorias_reparacion', $categoryFilter);
        }

        $this->applySummaryFilters($query, $filters, false);

        $hasSearchTerm = trim((string) ($filters['q'] ?? '')) !== '';
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

        if (($filters['q'] ?? '') !== '') {
            $term = trim((string) $filters['q']);
            $search = '%' . $term . '%';
            $numericTerm = ctype_digit($term) ? (int) $term : null;

            $query->where(function ($subQuery) use ($search, $numericTerm): void {
                $subQuery
                    ->where('nombre_cliente', 'like', $search)
                    ->orWhere('modelo', 'like', $search)
                    ->orWhere('descripcion', 'like', $search)
                    ->orWhere('contacto', 'like', $search)
                    ->orWhere('dni', 'like', $search);

                if ($numericTerm !== null) {
                    $subQuery
                        ->orWhere('id', $numericTerm)
                        ->orWhere('reparacion', $numericTerm);

                    if (Schema::hasColumn('ordenes', 'registro_id')) {
                        $subQuery->orWhere('registro_id', $numericTerm);
                    }
                }
            });
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

        if ($balance !== '' && is_numeric($balance)) {
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

    private function applyDeliveredOrderFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        $direction = strtolower((string) ($filters['orden'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        $query
            ->orderByRaw('fecha_entregado IS NULL')
            ->orderBy('fecha_entregado', $direction)
            ->orderBy('id', $direction)
            ->orderBy('reparacion');
    }

    private function applyOrderFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
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

    private function summaryQuery(array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = RepairOrder::query();
        $this->applySummaryFilters($query, $filters, true);

        return $query;
    }

    private function applySummaryFilters(\Illuminate\Database\Eloquent\Builder $query, array $filters, bool $includeCategory): void
    {
        $range = (string) ($filters['summary_range'] ?? 'month');

        if (! array_key_exists($range, self::SUMMARY_RANGE_DAYS)) {
            $range = 'month';
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

    private function addInitialPayment(RepairOrder $order, mixed $amount): void
    {
        $amount = min((float) $amount, (float) $order->monto);

        if ($amount <= 0) {
            return;
        }

        RepairPayment::query()->create([
            'orden_id' => $order->id,
            'reparacion' => $order->reparacion,
            'amount' => $amount,
            'payment_type' => 'senia',
            'method' => null,
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
    private function topTextMetric(Collection $orders, string $field): array
    {
        return $orders
            ->map(function (RepairOrder $order) use ($field): array {
                $label = trim((string) ($order->{$field} ?? ''));

                return [
                    'label' => $label !== '' ? Str::upper($label) : 'SIN DATO',
                    'total' => (float) $order->monto,
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
    private function topWorkTypes(Collection $orders): array
    {
        return $orders
            ->map(function (RepairOrder $order): array {
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

                return ['label' => $label, 'total' => (float) $order->monto];
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
    private function monthlyBilled(CarbonImmutable $yearStart): array
    {
        $rows = RepairOrder::query()
            ->whereNotIn('estado', ['CANCELADA'])
            ->whereDate('fecha', '>=', $yearStart->toDateString())
            ->where('monto', '>', 0)
            ->get()
            ->groupBy(fn (RepairOrder $order): string => optional($order->fecha)->format('m') ?: '00')
            ->map(fn (Collection $items): float => (float) $items->sum(fn (RepairOrder $order): float => (float) $order->monto));

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

    /**
     * @return array<int, array{
     *     modelo:?string,
     *     descripcion:string,
     *     observaciones:string,
     *     monto:float|int,
     *     senia:float|int,
     *     fecha_estimada:?string,
     *     estado:string,
     *     repuesto:?string,
     *     pedir_repuesto:bool,
     *     inventory_part_id:int,
     *     categorias_reparacion:int
     * }>
     */
    private function normalizeJobs(array $payload): array
    {
        $jobs = collect($payload['jobs'] ?? [Arr::only($payload, [
            'modelo',
            'tipo_servicio',
            'descripcion',
            'observaciones',
            'monto',
            'senia',
            'fecha_estimada',
            'estado',
            'repuesto',
            'inventory_part_id',
            'categorias_reparacion',
        ])])
            ->filter(fn ($job): bool => is_array($job))
            ->map(function (array $job): array {
                $serviceType = trim((string) ($job['tipo_servicio'] ?? ''));
                $template = self::SERVICE_TEMPLATES[$serviceType] ?? null;
                $model = trim((string) ($job['modelo'] ?? ''));
                $description = trim((string) ($job['descripcion'] ?? ''));
                $fallbackDescription = trim((string) ($template['description'] ?? ''));
                $shouldRequestPart = filter_var($job['pedir_repuesto'] ?? false, FILTER_VALIDATE_BOOL);
                $part = trim((string) ($job['repuesto'] ?? ''));
                $inventoryPartId = max(0, (int) ($job['inventory_part_id'] ?? 0));

                if ($description === '' && $fallbackDescription !== '') {
                    $description = $model !== '' ? trim($fallbackDescription . ' ' . $model) : $fallbackDescription;
                }

                $state = (string) ($job['estado'] ?? 'PENDIENTE');
                if (! $shouldRequestPart && $state === 'EN REPARACION / ESPERA REPUESTO') {
                    $state = 'PENDIENTE';
                }

                return [
                    'modelo' => $model !== '' ? $model : null,
                    'descripcion' => $description,
                    'observaciones' => trim((string) ($job['observaciones'] ?? '')) !== '' ? trim((string) ($job['observaciones'] ?? '')) : 'sin observaciones',
                    'monto' => $job['monto'] ?? 0,
                    'senia' => $job['senia'] ?? 0,
                    'fecha_estimada' => $job['fecha_estimada'] ?? null,
                    'estado' => $state,
                    'repuesto' => ($shouldRequestPart || $inventoryPartId > 0) && $part !== '' ? $part : null,
                    'pedir_repuesto' => $shouldRequestPart,
                    'inventory_part_id' => $inventoryPartId,
                    'categorias_reparacion' => max(1, (int) ($job['categorias_reparacion'] ?? 4)),
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

            return [[
                'modelo' => trim((string) ($payload['modelo'] ?? '')) !== '' ? trim((string) $payload['modelo']) : null,
                'descripcion' => $description,
                'observaciones' => trim((string) ($payload['observaciones'] ?? '')) !== '' ? trim((string) $payload['observaciones']) : 'sin observaciones',
                'monto' => $payload['monto'] ?? 0,
                'senia' => $payload['senia'] ?? 0,
                'fecha_estimada' => $payload['fecha_estimada'] ?? null,
                'estado' => ! $shouldRequestPart && ($payload['estado'] ?? null) === 'EN REPARACION / ESPERA REPUESTO' ? 'PENDIENTE' : ($payload['estado'] ?? 'PENDIENTE'),
                'repuesto' => ($shouldRequestPart || $inventoryPartId > 0) && $part !== '' ? $part : null,
                'pedir_repuesto' => $shouldRequestPart,
                'inventory_part_id' => $inventoryPartId,
                'categorias_reparacion' => max(1, (int) ($payload['categorias_reparacion'] ?? 4)),
            ]];
        }

        return $jobs;
    }
}
