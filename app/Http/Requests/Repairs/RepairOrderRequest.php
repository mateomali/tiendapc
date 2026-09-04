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
            'marca' => ['nullable', 'string', 'max:80'],
            'modelo' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:80'],
            'unlock_type' => ['nullable', 'string', 'in:pin,pattern'],
            'unlock_value' => ['nullable', 'string', 'max:80'],
            'descripcion' => ['nullable', 'string'],
            'observaciones' => ['nullable', 'string'],
            'info' => ['nullable', 'string'],
            'monto' => ['nullable', 'numeric', 'min:0'],
            'senia' => ['nullable', 'numeric', 'min:0'],
            'senia_method' => ['nullable', 'string', 'in:efectivo,transferencia'],
            'fecha_estimada' => ['nullable', 'date'],
            'estado' => ['nullable', 'string', 'max:80'],
            'cancelado_motivo' => ['nullable', 'required_if:estado,CANCELADA', 'string', 'max:1000'],
            'garantia_motivo' => ['nullable', 'required_if:estado,GARANTIA', 'string', 'max:1000'],
            'fecha_entregado' => ['nullable', 'date'],
            'repuesto' => ['nullable', 'string', 'max:255'],
            'repuesto_pedido' => ['nullable', 'boolean'],
            'repuesto_agregados' => ['nullable', 'array'],
            'repuesto_agregados.*' => ['string', 'in:funda,sim,memoria,sin_porta_chip,otro'],
            'repuesto_agregado_otro' => ['nullable', 'string', 'max:255'],
            'inventory_part_id' => ['nullable', 'integer', 'min:1'],
            'categorias_reparacion' => ['nullable', 'integer', 'min:1'],
            'images.*' => ['nullable', 'file', 'image', 'max:8192'],
            'final_images.*' => ['nullable', 'file', 'image', 'max:8192'],
            'jobs' => ['nullable', 'array', 'min:1'],
            'jobs.*.marca' => ['nullable', 'string', 'max:80'],
            'jobs.*.modelo' => ['nullable', 'string', 'max:255'],
            'jobs.*.color' => ['nullable', 'string', 'max:80'],
            'jobs.*.unlock_type' => ['nullable', 'string', 'in:pin,pattern'],
            'jobs.*.unlock_value' => ['nullable', 'string', 'max:80'],
            'jobs.*.tipo_servicio' => ['nullable', 'string', 'max:80'],
            'jobs.*.descripcion' => ['nullable', 'string'],
            'jobs.*.observaciones' => ['nullable', 'string'],
            'jobs.*.monto' => ['nullable', 'numeric', 'min:0'],
            'jobs.*.senia' => ['nullable', 'numeric', 'min:0'],
            'jobs.*.senia_method' => ['nullable', 'string', 'in:efectivo,transferencia'],
            'jobs.*.fecha_estimada' => ['nullable', 'date'],
            'jobs.*.estado' => ['nullable', 'string', 'max:80'],
            'jobs.*.repuesto' => ['nullable', 'string', 'max:255'],
            'jobs.*.pedir_repuesto' => ['nullable', 'boolean'],
            'jobs.*.repuesto_agregados' => ['nullable', 'array'],
            'jobs.*.repuesto_agregados.*' => ['string', 'in:funda,sim,memoria,sin_porta_chip,otro'],
            'jobs.*.repuesto_agregado_otro' => ['nullable', 'string', 'max:255'],
            'jobs.*.inventory_part_id' => ['nullable', 'integer', 'min:1'],
            'jobs.*.categorias_reparacion' => ['nullable', 'integer', 'min:1'],
            'jobs.*.images.*' => ['nullable', 'file', 'image', 'max:8192'],
        ];
    }
}
