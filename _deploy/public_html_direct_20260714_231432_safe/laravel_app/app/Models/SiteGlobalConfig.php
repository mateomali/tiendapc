<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteGlobalConfig extends Model
{
    /** @var array<string, string|null> */
    private static array $valueCache = [];

    protected $table = 'site_global_config';

    protected $primaryKey = 'config_key';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'config_key',
        'config_value',
    ];

    public static function value(string $key, ?string $default = null): ?string
    {
        if (! array_key_exists($key, self::$valueCache)) {
            self::$valueCache[$key] = static::query()->where('config_key', $key)->value('config_value');
        }

        return self::$valueCache[$key] ?? $default;
    }

    public static function putValue(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(
            ['config_key' => $key],
            ['config_value' => $value],
        );

        self::$valueCache[$key] = $value;
    }
}
