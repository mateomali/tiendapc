<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairPartBox extends Model
{
    protected $fillable = [
        'code',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
