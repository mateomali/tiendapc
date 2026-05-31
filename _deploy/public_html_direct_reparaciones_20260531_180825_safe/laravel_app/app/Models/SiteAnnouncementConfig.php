<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteAnnouncementConfig extends Model
{
    protected $table = 'site_announcement_config';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'rotation_ms',
    ];

    protected function casts(): array
    {
        return [
            'rotation_ms' => 'integer',
            'updated_at' => 'datetime',
        ];
    }
}
