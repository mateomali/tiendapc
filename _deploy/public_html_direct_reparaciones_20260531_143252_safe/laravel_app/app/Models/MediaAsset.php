<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaAsset extends Model
{
    protected $table = 'media_library';

    protected $fillable = [
        'title',
        'file_url',
        'tags',
        'mime_type',
        'file_size',
        'width',
        'height',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }
}
