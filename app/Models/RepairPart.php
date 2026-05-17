<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairPart extends Model
{
    protected $fillable = [
        'quantity',
        'model',
        'box',
        'sort_order',
        'reserved_order_id',
        'reserved_repair_number',
        'reserved_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'sort_order' => 'integer',
            'reserved_order_id' => 'integer',
            'reserved_repair_number' => 'integer',
            'reserved_at' => 'datetime',
        ];
    }
}
