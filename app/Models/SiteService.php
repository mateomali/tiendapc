<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteService extends Model
{
    protected $table = 'site_services';

    public $timestamps = false;

    protected $fillable = [
        'title',
        'subtitle',
        'description',
        'points_text',
        'image_url',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'updated_at' => 'datetime',
        ];
    }
}
