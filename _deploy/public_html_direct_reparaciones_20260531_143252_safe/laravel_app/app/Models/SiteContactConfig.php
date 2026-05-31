<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteContactConfig extends Model
{
    protected $table = 'site_contact_config';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'whatsapp_number',
        'contact_title',
        'contact_description',
        'contact_email',
        'maps_embed_url',
    ];
}
