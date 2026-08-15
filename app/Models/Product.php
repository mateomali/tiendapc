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
        'cash_discount_percentage',
        'cash_discount_mode',
        'cash_price',
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
            'cash_discount_percentage' => 'float',
            'cash_price' => 'integer',
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

    public function cashDiscountApplies(): bool
    {
        if (! $this->cashDiscountEnabled()) {
            return false;
        }

        $basePrice = $this->effectivePrice();
        $threshold = max(0, (int) SiteGlobalConfig::value('product_cash_discount_threshold', '20000'));

        if ($basePrice < $threshold) {
            return false;
        }

        if ($this->cashDiscountMode() === 'disabled') {
            return false;
        }

        if ($this->cashDiscountMode() === 'manual') {
            return $this->cash_price !== null && (int) $this->cash_price > 0 && (int) $this->cash_price < $basePrice;
        }

        return $this->cashDiscountPercentage() > 0;
    }

    public function cashDiscountPercentage(): float
    {
        if ($this->cashDiscountMode() === 'percentage' && $this->cash_discount_percentage !== null) {
            return max(0.0, min(100.0, (float) $this->cash_discount_percentage));
        }

        return max(0.0, min(100.0, (float) SiteGlobalConfig::value('product_cash_discount_percentage', '10')));
    }

    public function cashPrice(): ?int
    {
        if (! $this->cashDiscountApplies()) {
            return null;
        }

        $basePrice = $this->effectivePrice();
        if ($this->cashDiscountMode() === 'manual') {
            return min($basePrice - 1, max(1, (int) $this->cash_price));
        }

        $percentage = $this->cashDiscountPercentage();

        return max(1, (int) round($basePrice - ($basePrice * ($percentage / 100))));
    }

    public function cashDiscountMode(): string
    {
        $mode = strtolower(trim((string) $this->cash_discount_mode));

        return in_array($mode, ['global', 'percentage', 'manual', 'disabled'], true) ? $mode : 'global';
    }

    public function cashDiscountNote(): string
    {
        $note = trim((string) SiteGlobalConfig::value('product_cash_discount_note', 'Oferta en efectivo al retirar en el local.'));

        return $note !== '' ? $note : 'Oferta en efectivo al retirar en el local.';
    }

    private function cashDiscountEnabled(): bool
    {
        $value = SiteGlobalConfig::value('product_cash_discount_enabled', '1');

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on', 'si'], true);
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
