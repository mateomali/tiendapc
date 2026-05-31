<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'wp_product_id',
        'category_id',
        'name',
        'slug',
        'permalink',
        'sku',
        'short_description',
        'description',
        'price',
        'offer_price',
        'offer_start_at',
        'offer_end_at',
        'raw_price_minor',
        'currency_code',
        'stock',
        'stock_status',
        'image_url',
        'image_url_2',
        'image_url_3',
        'is_featured',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'offer_price' => 'integer',
            'raw_price_minor' => 'integer',
            'stock' => 'integer',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'offer_start_at' => 'datetime',
            'offer_end_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function scopeSellable(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function effectivePrice(): int
    {
        if ($this->offer_price === null || $this->offer_price <= 0) {
            return (int) $this->price;
        }

        return $this->offerIsActive() && $this->offer_price < $this->price
            ? (int) $this->offer_price
            : (int) $this->price;
    }

    public function offerIsActive(): bool
    {
        $now = now();

        if ($this->offer_price === null || $this->offer_price <= 0) {
            return false;
        }

        if ($this->offer_start_at !== null && $this->offer_start_at->isFuture()) {
            return false;
        }

        if ($this->offer_end_at !== null && $this->offer_end_at->isPast()) {
            return false;
        }

        return $now !== null;
    }

    public function gallery(): array
    {
        return array_values(array_filter([
            $this->image_url,
            $this->image_url_2,
            $this->image_url_3,
        ]));
    }
}
