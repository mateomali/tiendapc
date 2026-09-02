<?php

namespace App\Http\Controllers\Repairs;

use App\Http\Controllers\Controller;
use App\Models\RepairOrder;
use App\Models\RepairTaskItem;
use App\Models\SiteContactConfig;
use App\Models\SiteGlobalConfig;
use App\Services\RepairService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PublicTrackingController extends Controller
{
    public function __invoke(Request $request, RepairService $repairService): Response
    {
        $validated = $request->validate([
            'id_buscado' => ['nullable', 'integer'],
            'dni_buscado' => ['nullable', 'string', 'regex:/^\d{1,10}$/'],
            'orden' => ['nullable', 'integer'],
            'dni' => ['nullable', 'string', 'regex:/^\d{1,10}$/'],
            'auto' => ['nullable', 'integer'],
        ]);

        $validated['id_buscado'] = $validated['id_buscado'] ?? $validated['orden'] ?? null;
        $validated['dni_buscado'] = $validated['dni_buscado'] ?? $validated['dni'] ?? null;
        unset($validated['orden'], $validated['dni']);

        $searched = ($validated['id_buscado'] ?? null) !== null && ($validated['dni_buscado'] ?? null) !== null;
        $filters = array_filter($validated, static fn ($value): bool => $value !== null);
        $tickets = [];

        if ($searched) {
            $tickets = $this->groupPublicTickets(
                $repairService->track((int) $validated['id_buscado'], (string) $validated['dni_buscado']),
            );
        }

        return Inertia::render('Repairs/PublicTrackingPage', [
            'filters' => $filters,
            'searched' => $searched,
            'tickets' => $tickets,
            'publicView' => $this->publicView($validated),
            'feedback' => $this->feedback($searched, $tickets),
            'results' => $this->serializePublicResults($tickets),
        ]);
    }

    /**
     * @param Collection<int, RepairOrder> $orders
     * @return array<int, array<string, mixed>>
     */
    private function groupPublicTickets(Collection $orders): array
    {
        $queuePositions = $this->activeQueuePositions();

        return $orders
            ->groupBy('id')
            ->map(function (Collection $ticketOrders) use ($queuePositions): array {
                /** @var RepairOrder $base */
                $base = $ticketOrders->sortBy('reparacion')->first();

                return [
                    'id' => (int) $base->id,
                    'fecha' => $this->rawOrderDate($base, 'fecha'),
                    'repairsCount' => $ticketOrders->count(),
                    'totalMonto' => $ticketOrders->sum(fn (RepairOrder $order): float => (float) $order->monto),
                    'totalSenia' => $ticketOrders->sum(fn (RepairOrder $order): float => (float) $order->senia),
                    'repairs' => $ticketOrders
                        ->sortBy('reparacion')
                        ->map(fn (RepairOrder $order): array => $this->serializePublicOrderRepair($order, $queuePositions))
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{total:int, positions:array<int, int>}
     */
    private function activeQueuePositions(): array
    {
        $items = RepairTaskItem::query()
            ->with('repairOrder')
            ->whereNull('completed_at')
            ->oldest('task_date')
            ->oldest('created_at')
            ->oldest('id')
            ->get()
            ->filter(fn (RepairTaskItem $item): bool => $item->repairOrder !== null)
            ->filter(fn (RepairTaskItem $item): bool => ! in_array((string) $item->repairOrder?->estado, ['LISTA', 'CANCELADA'], true))
            ->values();

        $positions = [];

        foreach ($items as $index => $item) {
            $positions[(int) $item->repair_order_registro_id] = $index + 1;
        }

        return [
            'total' => $items->count(),
            'positions' => $positions,
        ];
    }

    /**
     * @param array{total:int, positions:array<int, int>} $queuePositions
     * @return array<string, mixed>
     */
    private function serializePublicOrderRepair(RepairOrder $order, array $queuePositions): array
    {
        $queuePosition = $queuePositions['positions'][(int) $order->registro_id] ?? null;

        return [
            'registro_id' => (int) $order->registro_id,
            'id' => (int) $order->id,
            'reparacion' => (int) $order->reparacion,
            'fecha' => $this->rawOrderDate($order, 'fecha'),
            'modelo' => $order->modelo,
            'descripcion' => $order->descripcion,
            'observaciones' => $order->observaciones,
            'monto' => $order->monto,
            'senia' => $order->senia,
            'fecha_estimada' => $this->rawOrderDate($order, 'fecha_estimada'),
            'estado' => $order->estado,
            'cancelado_motivo' => $order->cancelado_motivo,
            'garantia_motivo' => $order->garantia_motivo,
            'entregado' => $order->entregado,
            'fecha_entregado' => $this->rawOrderDate($order, 'fecha_entregado'),
            'imagenes' => $this->serializePublicImageFiles($this->parseImageList((string) ($order->getRawOriginal('imagen') ?? '')), false),
            'imagenes_finales' => $this->serializePublicImageFiles(array_values(array_filter([
                (string) ($order->getRawOriginal('imagen3') ?? ''),
                (string) ($order->getRawOriginal('imagen4') ?? ''),
            ])), true),
            'queue' => $queuePosition !== null ? [
                'position' => $queuePosition,
                'total' => $queuePositions['total'],
            ] : null,
            'events' => $order->events()->get()->map(fn ($event): array => [
                'evento' => $event->evento,
                'detalle' => $event->detalle,
                'estado_anterior' => $event->estado_anterior,
                'estado_nuevo' => $event->estado_nuevo,
                'created_at' => optional($event->created_at)->format('Y-m-d H:i'),
            ])->all(),
        ];
    }

    private function rawOrderDate(RepairOrder $order, string $key): ?string
    {
        $value = trim((string) ($order->getRawOriginal($key) ?? ''));

        return $value !== '' ? $value : null;
    }

    /**
     * @return array<int, string>
     */
    private function parseImageList(string $value): array
    {
        if (trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode('|', $value))));
    }

    /**
     * @param array<int, string> $filenames
     * @return array<int, array<string, string>>
     */
    private function serializePublicImageFiles(array $filenames, bool $final): array
    {
        return array_values(array_map(function (string $filename) use ($final): array {
            $path = trim($filename);
            $url = $this->publicImageUrl($path, false);
            $thumbnailUrl = $this->publicImageUrl($path, $final || $path !== '');

            return [
                'filename' => $path,
                'url' => $url,
                'thumbnailUrl' => $thumbnailUrl,
            ];
        }, $filenames));
    }

    private function publicImageUrl(string $filename, bool $thumbnail): string
    {
        if ($filename === '') {
            return '';
        }

        if (preg_match('/^https?:\/\//i', $filename) === 1 || str_starts_with($filename, '/')) {
            return $filename;
        }

        $directory = $thumbnail
            ? trim((string) config('tienda.uploads.repairs_thumbnails'), '/')
            : trim((string) config('tienda.uploads.repairs'), '/');
        $prefix = $thumbnail ? 'thumb_' : '';

        return asset($directory . '/' . $prefix . $filename);
    }

    /**
     * @param array{id_buscado?: int|null, dni_buscado?: string|null, auto?: int|null} $filters
     * @return array<string, string|bool>
     */
    private function publicView(array $filters, bool $showDniField = true): array
    {
        $whatsappNumber = $this->contactWhatsapp();
        $orderId = (int) ($filters['id_buscado'] ?? 0);
        $message = $orderId > 0
            ? sprintf('Hola, quiero consultar sobre mi reparación N° %d', $orderId)
            : 'Hola, quiero consultar sobre mi reparación';

        return [
            'brandUrl' => route('store.catalog'),
            'bannerUrl' => asset('assets/img/repair-banner-legacy.png'),
            'bannerFallbackUrl' => asset('assets/img/header-sudoku.png'),
            'title' => 'Estado de su reparación',
            'subtitle' => 'Usá los datos de tu comprobante para saber si tu equipo sigue en revisión, espera repuesto o ya está listo para retirar.',
            'orderLabel' => 'Número de orden',
            'orderPlaceholder' => 'Ej: 827',
            'dniLabel' => 'DNI o codigo del ticket',
            'dniPlaceholder' => 'Ingrese DNI o codigo',
            'showDniField' => $showDniField,
            'submitLabel' => 'Consultar',
            'resetLabel' => 'Consultar otra orden',
            'resetUrl' => route('repairs.tracking'),
            'whatsappUrl' => $this->buildWhatsappUrl($whatsappNumber, $message),
            'whatsappLabel' => '¿Tenés alguna duda? Escribinos',
            'addressTitle' => 'SUDOKU - ' . $this->businessAddress(),
            'hoursLabel' => 'Horario: ' . $this->businessHours(),
            'mapUrl' => $this->mapUrl(),
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $tickets
     * @return array<string, string>|null
     */
    private function feedback(bool $searched, array $tickets): ?array
    {
        if (! $searched || $tickets !== []) {
            return null;
        }

        return [
            'variant' => 'secondary',
            'message' => 'No se encontro ninguna orden con el ID y verificador ingresados.',
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $tickets
     * @return array<int, array<string, mixed>>
     */
    private function serializePublicResults(array $tickets): array
    {
        return array_values(array_map(fn (array $ticket): array => $this->serializePublicTicket($ticket), $tickets));
    }

    /**
     * @param array<string, mixed> $ticket
     * @return array<string, mixed>
     */
    private function serializePublicTicket(array $ticket): array
    {
        /** @var array<int, array<string, mixed>> $repairs */
        $repairs = array_values($ticket['repairs'] ?? []);
        $leadRepair = $repairs[0] ?? [];
        $leadStatus = $this->workStatus($leadRepair);
        $totalMonto = (float) ($ticket['totalMonto'] ?? 0);
        $totalSenia = (float) ($ticket['totalSenia'] ?? 0);
        $totalSaldo = max(0, $totalMonto - $totalSenia);

        return [
            'id' => (int) ($ticket['id'] ?? 0),
            'headline' => sprintf(
                'ORDEN #%d - %s',
                (int) ($ticket['id'] ?? 0),
                trim((string) ($leadRepair['modelo'] ?? 'Equipo'))
            ),
            'clusterVariant' => $leadStatus['variant'],
            'summaryLabel' => $this->summaryLabel($leadStatus['variant'], $totalMonto, $totalSenia, $totalSaldo),
            'repairs' => array_values(array_map(
                fn (array $repair, int $index): array => $this->serializePublicRepair($repair, (int) ($ticket['id'] ?? 0), $index === 0),
                $repairs,
                array_keys($repairs),
            )),
        ];
    }

    /**
     * @param array<string, mixed> $repair
     * @return array<string, mixed>
     */
    private function serializePublicRepair(array $repair, int $ticketId, bool $highlight): array
    {
        $status = $this->workStatus($repair);
        $monto = (float) ($repair['monto'] ?? 0);
        $senia = (float) ($repair['senia'] ?? 0);
        $saldo = max(0, $monto - $senia);
        $observaciones = trim((string) ($repair['observaciones'] ?? ''));
        $normalizedObservation = mb_strtolower(preg_replace('/\s+/', ' ', $observaciones) ?? '', 'UTF-8');
        $showObservations = $observaciones !== '' && ! in_array($normalizedObservation, ['sin observaciones', 'sin observacion'], true);

        $fields = [
            [
                'label' => 'Descripción',
                'value' => trim((string) ($repair['descripcion'] ?? '')) !== '' ? (string) $repair['descripcion'] : 'Sin descripción registrada.',
                'tone' => 'default',
            ],
        ];

        if ($monto > 0) {
            $fields[] = [
                'label' => 'Presupuesto',
                'value' => $this->formatCurrency($monto),
                'tone' => 'accent',
            ];
        }

        if ($senia > 0) {
            $fields[] = [
                'label' => 'Seña',
                'value' => $this->formatCurrency($senia),
                'tone' => 'accent',
            ];
            $fields[] = [
                'label' => 'Saldo',
                'value' => $this->formatCurrency($saldo),
                'tone' => 'total',
            ];
        }

        return [
            'id' => (int) ($repair['id'] ?? $ticketId),
            'repairNumber' => (int) ($repair['reparacion'] ?? 1),
            'registroId' => (int) ($repair['registro_id'] ?? 0),
            'headline' => sprintf(
                'ORDEN #%d - %s',
                $ticketId,
                trim((string) ($repair['modelo'] ?? 'Equipo'))
            ),
            'subheadline' => sprintf(
                'Orden #%d - Trabajo #%d',
                $ticketId,
                (int) ($repair['reparacion'] ?? 1)
            ),
            'model' => trim((string) ($repair['modelo'] ?? 'Equipo sin modelo')),
            'status' => $status,
            'entryImages' => $this->serializeImages(
                is_array($repair['imagenes'] ?? null) ? $repair['imagenes'] : [],
                sprintf('Orden #%d - Imágenes del producto ingresado', $ticketId),
                1,
            ),
            'finalImages' => $this->serializeImages(
                is_array($repair['imagenes_finales'] ?? null) ? $repair['imagenes_finales'] : [],
                sprintf('Orden #%d - Imágenes del resultado final', $ticketId),
                3,
            ),
            'fields' => $fields,
            'observation' => $showObservations ? [
                'title' => 'Comentarios del técnico',
                'text' => $observaciones,
                'announcedAt' => $this->commentAnnouncementDate($repair),
            ] : null,
            'highlight' => $highlight,
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $images
     * @return array<int, array<string, string>>
     */
    private function serializeImages(array $images, string $title, int $offset): array
    {
        return array_values(array_map(function (array $image, int $index) use ($title, $offset): array {
            $label = 'Foto ' . ($index + $offset);

            return [
                'label' => $label,
                'title' => $title . ' - ' . $label,
                'url' => (string) ($image['url'] ?? ''),
                'thumbnailUrl' => (string) ($image['thumbnailUrl'] ?? $image['url'] ?? ''),
            ];
        }, $images, array_keys($images)));
    }

    /**
     * @param array<string, mixed> $repair
     * @return array<string, mixed>
     */
    private function workStatus(array $repair): array
    {
        $delivered = trim((string) ($repair['entregado'] ?? ''));
        $state = trim((string) ($repair['estado'] ?? ''));

        if ($delivered === 'si') {
            $date = trim((string) ($repair['fecha_entregado'] ?? ''));

            if ($date !== '') {
                try {
                    $deliveredAt = CarbonImmutable::parse($date, 'America/Argentina/Buenos_Aires')->startOfDay();
                    $today = now('America/Argentina/Buenos_Aires')->startOfDay();
                    $days = $today->diffInDays($deliveredAt);

                    if ($today->greaterThan($deliveredAt)) {
                        return [
                            'variant' => 'info',
                            'message' => sprintf('Este trabajo fue retirado hace %d días.', $days),
                            'announcedAt' => $this->formatAnnouncement($date),
                        ];
                    }

                    if ($today->lessThan($deliveredAt)) {
                        return [
                            'variant' => 'info',
                            'message' => 'Este trabajo fue retirado (fecha futura).',
                            'announcedAt' => $this->formatAnnouncement($date),
                        ];
                    }

                    return [
                        'variant' => 'info',
                        'message' => 'Este trabajo fue retirado hoy.',
                        'announcedAt' => $this->formatAnnouncement($date),
                    ];
                } catch (\Throwable) {
                    // Fall through to the generic message if the date cannot be parsed.
                }
            }

            return [
                'variant' => 'info',
                'message' => 'Este trabajo figura como retirado.',
                'announcedAt' => $this->formatAnnouncement($date),
            ];
        }

        if ($state === 'LISTA') {
            $address = $this->businessAddress();
            $hours = $this->businessHours();

            return [
                'variant' => 'success',
                'message' => '¡Tu reparación está lista! Podés pasar a retirarla por el local.',
                'announcedAt' => $this->stateAnnouncementDate($repair),
                'pickup' => [
                    'title' => 'Horario para retirar',
                    'address' => 'SUDOKU - ' . $address,
                    'hours' => $hours,
                ],
            ];
        }

        if (in_array($state, ['EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'], true)) {
            $status = [
                'variant' => 'waiting',
                'message' => 'Tu equipo está en proceso de reparación.',
                'announcedAt' => $this->stateAnnouncementDate($repair),
            ];

            if (is_array($repair['queue'] ?? null)) {
                $position = (int) ($repair['queue']['position'] ?? 0);
                $total = (int) ($repair['queue']['total'] ?? 0);

                if ($position > 0 && $total > 0) {
                    $status['queue'] = [
                        'position' => $position,
                        'total' => $total,
                        'message' => sprintf('Tu equipo está en el puesto %d de %d en la cola de trabajo.', $position, $total),
                    ];
                }
            }

            return $status;
        }

        if ($state === 'PENDIENTE') {
            return [
                'variant' => 'warning',
                'message' => 'Todavía no pudimos revisar tu equipo. Por favor, intentá más tarde.',
                'announcedAt' => $this->stateAnnouncementDate($repair),
            ];
        }

        if ($state === 'CANCELADA') {
            $reason = trim((string) ($repair['cancelado_motivo'] ?? ''));

            return [
                'variant' => 'danger',
                'message' => $reason !== ''
                    ? 'Este trabajo fue cancelado. Motivo: ' . $reason
                    : 'Este trabajo fue cancelado. Podés pasar a retirar el equipo por el local.',
                'announcedAt' => $this->stateAnnouncementDate($repair),
                'pickup' => [
                    'title' => 'Retiro del equipo',
                    'address' => 'SUDOKU - ' . $this->businessAddress(),
                    'hours' => $this->businessHours(),
                ],
            ];
        }

        return [
            'variant' => 'danger',
            'message' => 'No se pudo realizar este trabajo. Contactate con el local para más detalles.',
            'announcedAt' => $this->stateAnnouncementDate($repair),
        ];
    }

    /**
     * @param array<string, mixed> $repair
     */
    private function stateAnnouncementDate(array $repair): ?string
    {
        $currentState = $this->normalizeState((string) ($repair['estado'] ?? ''));
        /** @var array<int, array<string, mixed>> $events */
        $events = is_array($repair['events'] ?? null) ? $repair['events'] : [];

        if ($currentState !== '') {
            foreach ($events as $event) {
                $nextState = $this->normalizeState((string) ($event['estado_nuevo'] ?? ''));
                $eventType = strtoupper(trim((string) ($event['evento'] ?? '')));
                $previousState = $this->normalizeState((string) ($event['estado_anterior'] ?? ''));
                $hasRealStateChange = $previousState !== '' && $previousState !== $nextState;

                if ($nextState !== $currentState || empty($event['created_at'])) {
                    continue;
                }

                if (in_array($eventType, ['CAMBIO_ESTADO', 'ENTREGADA', 'CREADA'], true) || $hasRealStateChange) {
                    return $this->formatAnnouncement((string) $event['created_at']);
                }
            }
        }

        if (trim((string) ($repair['fecha_entregado'] ?? '')) !== '') {
            return $this->formatAnnouncement((string) $repair['fecha_entregado']);
        }

        if (trim((string) ($repair['fecha'] ?? '')) !== '') {
            return $this->formatAnnouncement((string) $repair['fecha']);
        }

        return null;
    }

    /**
     * @param array<string, mixed> $repair
     */
    private function commentAnnouncementDate(array $repair): ?string
    {
        /** @var array<int, array<string, mixed>> $events */
        $events = is_array($repair['events'] ?? null) ? $repair['events'] : [];

        foreach ($events as $event) {
            $eventType = strtoupper(trim((string) ($event['evento'] ?? '')));

            if ($eventType === 'COMENTARIO_TECNICO' && ! empty($event['created_at'])) {
                return $this->formatAnnouncement((string) $event['created_at']);
            }
        }

        foreach ($events as $event) {
            $eventType = strtoupper(trim((string) ($event['evento'] ?? '')));

            if (in_array($eventType, ['ACTUALIZADA', 'ACTUALIZADA_ENTREGADA', 'CREADA'], true) && ! empty($event['created_at'])) {
                return $this->formatAnnouncement((string) $event['created_at']);
            }
        }

        if (trim((string) ($repair['fecha'] ?? '')) !== '') {
            return $this->formatAnnouncement((string) $repair['fecha']);
        }

        return null;
    }

    private function summaryLabel(string $variant, float $totalMonto, float $totalSenia, float $totalSaldo): string
    {
        if ($variant === 'warning') {
            return $totalSenia > 0
                ? 'TOTAL A PAGAR: ' . $this->formatCurrency($totalSaldo)
                : 'TOTAL A PAGAR: ' . $this->formatCurrency($totalMonto);
        }

        return $totalSenia > 0
            ? 'SALDO TOTAL: ' . $this->formatCurrency($totalSaldo)
            : 'TOTAL A PAGAR: ' . $this->formatCurrency($totalMonto);
    }

    private function formatCurrency(float $amount): string
    {
        return '$' . number_format($amount, 0, ',', '.');
    }

    private function formatAnnouncement(?string $value): ?string
    {
        $raw = trim((string) $value);

        if ($raw === '') {
            return null;
        }

        try {
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw) === 1) {
                return CarbonImmutable::createFromFormat('Y-m-d', $raw, 'America/Argentina/Buenos_Aires')
                    ->format('d/m/Y');
            }

            return CarbonImmutable::parse($raw, 'America/Argentina/Buenos_Aires')
                ->timezone('America/Argentina/Buenos_Aires')
                ->format('d/m/Y H:i');
        } catch (\Throwable) {
            return $raw;
        }
    }

    private function normalizeState(string $value): string
    {
        return mb_strtoupper(trim($value), 'UTF-8');
    }

    private function contactWhatsapp(): string
    {
        $contact = SiteContactConfig::query()->find(1);
        $number = (string) ($contact?->whatsapp_number ?: SiteGlobalConfig::value('whatsapp_number', config('tienda.whatsapp_number')));

        return preg_replace('/\D+/', '', $number) ?: (string) config('tienda.whatsapp_number');
    }

    private function value(string $key, string $default): string
    {
        return (string) (SiteGlobalConfig::value($key, $default) ?? $default);
    }

    private function businessAddress(): string
    {
        return $this->value('footer_address', 'Av. José de San Martín 2658, Merlo');
    }

    private function businessHours(): string
    {
        return $this->value('footer_hours', 'Lunes a viernes de 10:30 a 13:30 y 17:00 a 20:30 | Sábados 17:00 a 20:30');
    }

    private function mapUrl(): string
    {
        $configured = trim($this->value('footer_map_url', ''));

        if ($configured !== '') {
            return $this->normalizeMapLink($configured);
        }

        return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('SUDOKU ' . $this->businessAddress());
    }

    private function normalizeMapLink(string $url): string
    {
        $query = parse_url($url, PHP_URL_QUERY);

        if (is_string($query)) {
            parse_str($query, $params);

            if (isset($params['q']) && trim((string) $params['q']) !== '') {
                return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode((string) $params['q']);
            }
        }

        if (str_contains($url, 'output=embed')) {
            return 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('SUDOKU ' . $this->businessAddress());
        }

        return $url;
    }

    private function buildWhatsappUrl(string $number, string $message): string
    {
        return 'https://wa.me/' . $number . '?text=' . rawurlencode($message);
    }

    private function formatLocalWhatsappDisplay(string $number): string
    {
        if (strlen($number) === 12 && str_starts_with($number, '54')) {
            return substr($number, 2, 2) . ' ' . substr($number, 4, 4) . '-' . substr($number, 8);
        }

        if (strlen($number) === 10) {
            return substr($number, 0, 2) . ' ' . substr($number, 2, 4) . '-' . substr($number, 6);
        }

        return '+' . $number;
    }
}
