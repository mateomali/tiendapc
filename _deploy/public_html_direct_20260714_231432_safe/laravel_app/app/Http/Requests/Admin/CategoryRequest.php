<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'group_key' => ['nullable', 'string', 'max:32'],
            'sort_order' => ['nullable', 'integer', 'min:1'],
            'is_hidden' => ['nullable', 'boolean'],
        ];
    }
}
