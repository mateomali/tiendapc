<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairEvent extends Model
{
    protected $table = 'orden_eventos';

    public const UPDATED_AT = null;

    protected $fillable = [
        'orden_id',
        'reparacion',
        'usuario',
        'evento',
        'estado_anterior',
        'estado_nuevo',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'orden_id' => 'integer',
            'reparacion' => 'integer',
            'created_at' => 'datetime',
        ];
    }
}
