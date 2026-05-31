<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RepairDeviceModel extends Model
{
    protected $fillable = [
        'category_id',
        'brand',
        'model',
        'normalized_model',
        'usage_count',
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'usage_count' => 'integer',
        ];
    }
}
