<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180'],
            'permalink' => ['nullable', 'string', 'max:500'],
            'sku' => ['nullable', 'string', 'max:120'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'offer_price' => ['nullable', 'integer', 'min:0'],
            'offer_start_at' => ['nullable', 'date'],
            'offer_end_at' => ['nullable', 'date'],
            'cash_discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'cash_discount_mode' => ['nullable', 'string', 'in:global,percentage,manual,disabled'],
            'cash_price' => ['nullable', 'integer', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'stock_status' => ['nullable', 'string', 'max:20'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'image_url_2' => ['nullable', 'string', 'max:500'],
            'image_url_3' => ['nullable', 'string', 'max:500'],
            'is_featured' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
