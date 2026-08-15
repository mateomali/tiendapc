<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteServicesConfig extends Model
{
    protected $table = 'site_services_config';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'hero_eyebrow',
        'hero_title',
        'hero_description',
        'cta_title',
        'cta_description',
        'cta_whatsapp_text',
        'cta_repair_text',
    ];
}
