<?php

namespace App\Http\Controllers\Repairs;

use App\Http\Controllers\Controller;
use App\Models\RepairAnnotation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnotationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Repairs/AnnotationsPage', [
            'annotations' => RepairAnnotation::query()
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->limit(300)
                ->get()
                ->map(fn (RepairAnnotation $annotation): array => $this->serializeAnnotation($annotation))
                ->all(),
            'actions' => [
                'store' => route('repairs.annotations.store'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        RepairAnnotation::query()->create([
            'body' => trim((string) $validated['body']),
            'source' => 'manual',
            'occurred_at' => now(),
        ]);

        return back()->with('success', 'Anotacion agregada.');
    }

    public function update(Request $request, RepairAnnotation $repairAnnotation): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $repairAnnotation->update([
            'body' => trim((string) $validated['body']),
        ]);

        return back()->with('success', 'Anotacion actualizada.');
    }

    public function destroy(RepairAnnotation $repairAnnotation): RedirectResponse
    {
        $repairAnnotation->delete();

        return back()->with('success', 'Anotacion eliminada.');
    }

    private function serializeAnnotation(RepairAnnotation $annotation): array
    {
        return [
            'id' => $annotation->id,
            'body' => $annotation->body,
            'source' => $annotation->source,
            'sourceLabel' => $annotation->source === 'order_info' ? 'Info de orden' : 'Manual',
            'repairOrderId' => $annotation->repair_order_id,
            'repairOrderRegistroId' => $annotation->repair_order_registro_id,
            'customerName' => $annotation->customer_name,
            'occurredAt' => optional($annotation->occurred_at)->format('Y-m-d H:i'),
            'updateAction' => route('repairs.annotations.update', $annotation),
            'deleteAction' => route('repairs.annotations.delete', $annotation),
        ];
    }
}
