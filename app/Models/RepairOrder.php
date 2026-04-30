<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RepairOrder extends Model
{
    protected $table = 'ordenes';

    protected $primaryKey = 'registro_id';

    private static ?bool $legacyPrimaryKey = null;

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        if ($this->usesLegacyPrimaryKey()) {
            $this->primaryKey = 'id';
        }
    }

    protected $fillable = [
        'id',
        'reparacion',
        'fecha',
        'nombre_cliente',
        'dni',
        'contacto',
        'modelo',
        'descripcion',
        'observaciones',
        'monto',
        'senia',
        'fecha_estimada',
        'estado',
        'entregado',
        'fecha_entregado',
        'imagen',
        'imagen3',
        'imagen4',
        'repuesto',
        'repuesto_pedido',
        'repuesto_pedido_at',
        'repuesto_pedido_oculto_at',
        'categorias_reparacion',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'reparacion' => 'integer',
            'dni' => 'integer',
            'monto' => 'decimal:2',
            'senia' => 'decimal:2',
            'categorias_reparacion' => 'integer',
            'fecha' => 'date',
            'fecha_estimada' => 'date',
            'fecha_entregado' => 'date',
            'repuesto_pedido' => 'boolean',
            'repuesto_pedido_at' => 'datetime',
            'repuesto_pedido_oculto_at' => 'datetime',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(RepairEvent::class, 'orden_id', 'id')
            ->where('reparacion', $this->reparacion)
            ->orderByDesc('created_at');
    }

    public function trackingDni(): int
    {
        return $this->dni > 0 ? (int) $this->dni : (int) config('tienda.repair_default_dni');
    }

    public function originalImages(): array
    {
        return $this->parsePipeImages($this->imagen);
    }

    public function finalImages(): array
    {
        return array_values(array_filter([$this->imagen3, $this->imagen4]));
    }

    private function parsePipeImages(?string $value): array
    {
        if ($value === null || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode('|', $value))));
    }

    private function usesLegacyPrimaryKey(): bool
    {
        if (self::$legacyPrimaryKey !== null) {
            return self::$legacyPrimaryKey;
        }

        try {
            self::$legacyPrimaryKey = Schema::hasTable($this->table)
                && ! Schema::hasColumn($this->table, 'registro_id');
        } catch (Throwable) {
            self::$legacyPrimaryKey = false;
        }

        return self::$legacyPrimaryKey;
    }
}
