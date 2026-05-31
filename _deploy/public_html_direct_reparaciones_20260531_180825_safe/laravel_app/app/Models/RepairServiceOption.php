<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairServiceOption extends Model
{
    protected $fillable = [
        'type',
        'value',
        'label',
        'description',
        'repuesto',
        'usage_count',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'usage_count' => 'integer',
            'sort_order' => 'integer',
            'active' => 'boolean',
        ];
    }
}
