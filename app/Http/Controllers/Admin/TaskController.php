<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RepairOrder;
use App\Models\RepairTaskItem;
use App\Services\RepairService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class TaskController extends Controller
{
    public function index(): Response
    {
        try {
            $items = RepairTaskItem::query()
                ->with('repairOrder')
                ->whereNull('completed_at')
                ->oldest('task_date')
                ->oldest('created_at')
                ->oldest('id')
                ->get()
                ->filter(fn (RepairTaskItem $item): bool => $item->repairOrder !== null)
                ->values();

            return Inertia::render('Admin/TasksPage', [
                'todayLabel' => 'Cola activa',
                'items' => $items->map(fn (RepairTaskItem $item): array => $this->serializeTaskItem($item))->all(),
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
                'todayLabel' => 'Cola activa',
                'items' => [],
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

        $taskItem->update(['completed_at' => now()]);

        return back()->with('success', 'Trabajo terminado.');
    }

    public function remove(RepairTaskItem $taskItem): RedirectResponse
    {
        $taskItem->delete();

        return back()->with('success', 'Trabajo quitado de tareas.');
    }

    private function serializeTaskItem(RepairTaskItem $item): array
    {
        /** @var RepairOrder $repair */
        $repair = $item->repairOrder;
        $monto = (float) $repair->monto;
        $senia = (float) $repair->senia;

        return [
            'id' => $item->id,
            'registroId' => $repair->registro_id,
            'ticketId' => $repair->id,
            'repairNumber' => $repair->reparacion,
            'clientName' => $repair->nombre_cliente,
            'dni' => $repair->dni,
            'contact' => $repair->contacto,
            'date' => optional($repair->fecha)->format('Y-m-d'),
            'estimatedDate' => optional($repair->fecha_estimada)->format('Y-m-d'),
            'model' => $repair->modelo,
            'description' => $repair->descripcion,
            'observations' => $repair->observaciones,
            'status' => $repair->estado,
            'balance' => max(0, $monto - $senia),
            'ticketUrl' => route('repairs.tickets.show', ['orderId' => $repair->id]),
            'completeAction' => route('tasks.complete', $item),
            'removeAction' => route('tasks.remove', $item),
        ];
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
