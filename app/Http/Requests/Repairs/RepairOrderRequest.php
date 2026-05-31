<?php

namespace App\Http\Requests\Repairs;

use Illuminate\Foundation\Http\FormRequest;

class RepairOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre_cliente' => ['required', 'string', 'max:160'],
            'id_orden' => ['nullable', 'integer', 'min:1'],
            'id_nuevo' => ['nullable', 'integer', 'min:1'],
            'fecha' => ['nullable', 'date'],
            'dni' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'contacto' => ['nullable', 'string', 'max:160'],
            'modelo' => ['nullable', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'info' => ['nullable', 'string'],
            'monto' => ['nullable', 'numeric', 'min:0'],
            'senia' => ['nullable', 'numeric', 'min:0'],
            'fecha_estimada' => ['nullable', 'date'],
            'estado' => ['nullable', 'string', 'max:80'],
            'fecha_entregado' => ['nullable', 'date'],
            'repuesto' => ['nullable', 'string', 'max:255'],
            'repuesto_pedido' => ['nullable', 'boolean'],
            'inventory_part_id' => ['nullable', 'integer', 'min:1'],
            'categorias_reparacion' => ['nullable', 'integer', 'min:1'],
            'images.*' => ['nullable', 'file', 'image', 'max:8192'],
            'final_images.*' => ['nullable', 'file', 'image', 'max:8192'],
            'jobs' => ['nullable', 'array', 'min:1'],
            'jobs.*.modelo' => ['nullable', 'string', 'max:255'],
            'jobs.*.tipo_servicio' => ['nullable', 'string', 'max:80'],
            'jobs.*.descripcion' => ['nullable', 'string'],
            'jobs.*.observaciones' => ['nullable', 'string'],
            'jobs.*.monto' => ['nullable', 'numeric', 'min:0'],
            'jobs.*.senia' => ['nullable', 'numeric', 'min:0'],
            'jobs.*.fecha_estimada' => ['nullable', 'date'],
            'jobs.*.estado' => ['nullable', 'string', 'max:80'],
            'jobs.*.repuesto' => ['nullable', 'string', 'max:255'],
            'jobs.*.pedir_repuesto' => ['nullable', 'boolean'],
            'jobs.*.inventory_part_id' => ['nullable', 'integer', 'min:1'],
            'jobs.*.categorias_reparacion' => ['nullable', 'integer', 'min:1'],
            'jobs.*.images.*' => ['nullable', 'file', 'image', 'max:8192'],
        ];
    }
}
