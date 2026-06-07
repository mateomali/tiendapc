<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class RepairTaskItem extends Model
{
    protected $fillable = [
        'repair_order_registro_id',
        'task_date',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'task_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function repairOrder(): BelongsTo
    {
        $ownerKey = Schema::hasColumn('ordenes', 'registro_id') ? 'registro_id' : 'id';

        return $this->belongsTo(RepairOrder::class, 'repair_order_registro_id', $ownerKey);
    }
}
