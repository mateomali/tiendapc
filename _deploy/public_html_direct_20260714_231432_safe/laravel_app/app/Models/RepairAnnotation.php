<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairAnnotation extends Model
{
    protected $fillable = [
        'body',
        'source',
        'repair_order_id',
        'repair_order_registro_id',
        'customer_name',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'repair_order_id' => 'integer',
            'repair_order_registro_id' => 'integer',
            'occurred_at' => 'datetime',
        ];
    }
}
