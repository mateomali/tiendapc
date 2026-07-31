<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteAnnouncement extends Model
{
    protected $table = 'site_announcements';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'message',
        'link_url',
        'display_type',
        'image_url',
        'mobile_image_url',
        'sort_order',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
