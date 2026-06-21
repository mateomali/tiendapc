<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Repairs\WorkbenchController;
use App\Models\RepairPart;
use App\Models\RepairOrder;
use App\Models\RepairTaskItem;
use App\Services\RepairService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TaskController extends Controller
{
    public function index(RepairService $repairService, WorkbenchController $workbenchController): Response
    {
        try {
            $repairService->completePreviousTerminalTaskItems();

            $items = RepairTaskItem::query()
                ->with('repairOrder')
                ->whereNull('completed_at')
                ->oldest('task_date')
                ->oldest('created_at')
                ->oldest('id')
                ->get()
                ->filter(fn (RepairTaskItem $item): bool => $item->repairOrder !== null)
                ->values();
            $activeItems = $items
                ->filter(fn (RepairTaskItem $item): bool => ! in_array((string) $item->repairOrder?->estado, ['LISTA', 'CANCELADA'], true))
                ->values();
            $completedItems = $items
                ->filter(fn (RepairTaskItem $item): bool => in_array((string) $item->repairOrder?->estado, ['LISTA', 'CANCELADA'], true))
                ->values();

            return Inertia::render('Admin/TasksPage', [
                'todayLabel' => 'Tareas para hoy',
                'items' => $this->serializeTaskTickets($activeItems, $workbenchController),
                'completedItems' => $this->serializeTaskTickets($completedItems, $workbenchController),
                'states' => $repairService->availableStates(false),
                'serviceCategories' => $this->serviceCategories(),
                'serviceTemplates' => $repairService->serviceTemplates(),
                'partInventory' => $this->partInventoryOptions(),
                'urls' => [
                    'consultations' => route('repairs.workbench'),
                ],
                'debugError' => null,
            ]);
        } catch (Throwable $exception) {
            Log::error('Tasks page failed to load.', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ]);

            return Inertia::render('Admin/TasksPage', [
                'todayLabel' => 'Tareas para hoy',
                'items' => [],
                'completedItems' => [],
                'states' => $repairService->availableStates(false),
                'serviceCategories' => $this->serviceCategories(),
                'serviceTemplates' => $repairService->serviceTemplates(),
                'partInventory' => $this->partInventoryOptions(),
                'urls' => [
                    'consultations' => route('repairs.workbench'),
                ],
                'debugError' => $this->tasksDebugPayload($exception),
            ]);
        }
    }

    public function addRepair(RepairOrder $repairOrder, RepairService $repairService): RedirectResponse
    {
        $today = now()->toDateString();
        $item = RepairTaskItem::query()
            ->where('repair_order_registro_id', $repairOrder->registro_id)
            ->whereNull('completed_at')
            ->oldest('task_date')
            ->oldest('created_at')
            ->oldest('id')
            ->first();

        if ($item !== null) {
            $item->delete();
            $repairService->updateState($repairOrder, 'PENDIENTE');

            return back()->with('success', 'Trabajo quitado de tareas.');
        }

        RepairTaskItem::query()
            ->where('repair_order_registro_id', $repairOrder->registro_id)
            ->whereNull('completed_at')
            ->delete();

        $item = RepairTaskItem::query()->create([
            'repair_order_registro_id' => $repairOrder->registro_id,
            'task_date' => $today,
            'completed_at' => null,
        ]);

        if ($repairOrder->estado !== 'EN REPARACION') {
            $repairService->updateState($repairOrder, 'EN REPARACION');
        }

        return back()->with('success', 'Trabajo agregado a tareas.');
    }

    public function complete(RepairTaskItem $taskItem, RepairService $repairService): RedirectResponse
    {
        if ($taskItem->repairOrder !== null) {
            $repairService->markReady($taskItem->repairOrder);
        }

        return back()->with('success', 'Trabajo marcado como listo y enviado al final de tareas.');
    }

    public function remove(RepairTaskItem $taskItem): RedirectResponse
    {
        $taskItem->delete();

        return back()->with('success', 'Trabajo quitado de tareas.');
    }

    /**
     * @param Collection<int, RepairTaskItem> $items
     * @return array<int, array<string, mixed>>
     */
    private function serializeTaskTickets(Collection $items, WorkbenchController $workbenchController): array
    {
        $orders = $items
            ->map(fn (RepairTaskItem $item): ?RepairOrder => $item->repairOrder)
            ->filter()
            ->values();

        return $workbenchController->groupTickets($orders, false);
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

    /**
     * @return array<int, array<string, mixed>>
     */
    private function partInventoryOptions(): array
    {
        return RepairPart::query()
            ->where('quantity', '>', 0)
            ->whereNull('reserved_order_id')
            ->oldest('box')
            ->oldest('sort_order')
            ->oldest('id')
            ->get()
            ->map(fn (RepairPart $part): array => [
                'id' => $part->id,
                'quantity' => $part->quantity,
                'model' => $part->model,
                'box' => $part->box,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function tasksDebugPayload(Throwable $exception): array
    {
        return [
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'database' => config('database.default'),
            'checks' => $this->tasksDebugChecks(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function tasksDebugChecks(): array
    {
        try {
            return [
                'repair_task_items_exists' => Schema::hasTable('repair_task_items'),
                'ordenes_exists' => Schema::hasTable('ordenes'),
                'ordenes_has_registro_id' => Schema::hasColumn('ordenes', 'registro_id'),
                'ordenes_has_id' => Schema::hasColumn('ordenes', 'id'),
                'repair_task_items_columns' => Schema::hasTable('repair_task_items') ? Schema::getColumnListing('repair_task_items') : [],
            ];
        } catch (Throwable $checkException) {
            return [
                'checks_failed' => true,
                'exception' => $checkException::class,
                'message' => $checkException->getMessage(),
            ];
        }
    }
}
