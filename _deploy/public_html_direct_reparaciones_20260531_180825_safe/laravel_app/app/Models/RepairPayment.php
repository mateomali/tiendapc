<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairPayment extends Model
{
    protected $fillable = [
        'orden_id',
        'reparacion',
        'amount',
        'payment_type',
        'method',
        'notes',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'orden_id' => 'integer',
            'reparacion' => 'integer',
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }
}
