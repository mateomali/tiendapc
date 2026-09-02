<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'tracking_token',
        'contacto',
        'marca',
        'modelo',
        'color',
        'unlock_type',
        'unlock_value',
        'descripcion',
        'observaciones',
        'info',
        'monto',
        'senia',
        'fecha_estimada',
        'estado',
        'entregado',
        'fecha_entregado',
        'archivado_at',
        'archivado_motivo',
        'cancelado_motivo',
        'garantia_motivo',
        'imagen',
        'imagen3',
        'imagen4',
        'repuesto',
        'repuesto_pedido',
        'repuesto_pedido_at',
        'repuesto_pedido_oculto_at',
        'inventory_part_id',
        'inventory_part_model',
        'inventory_part_box',
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
            'archivado_at' => 'datetime',
            'repuesto_pedido' => 'boolean',
            'repuesto_pedido_at' => 'datetime',
            'repuesto_pedido_oculto_at' => 'datetime',
            'inventory_part_id' => 'integer',
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

    public function hasClientDni(): bool
    {
        return (int) $this->dni > 0 && (int) $this->dni !== (int) config('tienda.repair_default_dni');
    }

    public function trackingVerifier(): string
    {
        if ($this->hasClientDni()) {
            return (string) $this->dni;
        }

        $token = trim((string) ($this->tracking_token ?? ''));

        return $token !== '' ? str_pad($token, 5, '0', STR_PAD_LEFT) : (string) config('tienda.repair_default_dni');
    }

    public function getRegistroIdAttribute(mixed $value): int
    {
        return (int) ($value ?? $this->attributes['id'] ?? 0);
    }

    public function getRouteKey(): mixed
    {
        if ($this->usesLegacyPrimaryKey()) {
            return ((int) $this->id) . '-' . ((int) $this->reparacion);
        }

        return parent::getRouteKey();
    }

    public function resolveRouteBinding($value, $field = null): ?self
    {
        if (! $this->usesLegacyPrimaryKey()) {
            return parent::resolveRouteBinding($value, $field);
        }

        $rawValue = trim((string) $value);
        [$orderId, $repairNumber] = array_pad(explode('-', $rawValue, 2), 2, null);

        $query = $this->newQuery()->where('id', (int) $orderId);

        if ($repairNumber !== null && trim((string) $repairNumber) !== '') {
            $query->where('reparacion', (int) $repairNumber);
        }

        return $query->orderBy('reparacion')->first();
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

    protected function setKeysForSaveQuery($query): Builder
    {
        if ($this->usesLegacyPrimaryKey()) {
            return $query
                ->where('id', $this->getOriginal('id', $this->id))
                ->where('reparacion', $this->getOriginal('reparacion', $this->reparacion));
        }

        return parent::setKeysForSaveQuery($query);
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
