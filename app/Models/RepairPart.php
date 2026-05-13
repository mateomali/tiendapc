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
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
