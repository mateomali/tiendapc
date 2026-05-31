<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'ticket_number',
        'customer_label',
        'issued_at',
        'subtotal',
        'total',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'ticket_number' => 'integer',
            'issued_at' => 'datetime',
            'subtotal' => 'integer',
            'total' => 'integer',
            'created_by_user_id' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function ticketNumberDisplay(): string
    {
        return str_pad((string) $this->ticket_number, 8, '0', STR_PAD_LEFT);
    }
}
