<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class LegacyImportService
{
    private const SOURCE_CONNECTION = 'legacy_source';
    private const SOURCE_REPAIRS_CONNECTION = 'legacy_source_repairs';
    private const TARGET_CONNECTION = 'mysql';
    private const CHUNK_SIZE = 200;

    /**
     * @return array{tables: array<int, array{name: string, imported: int|string}>, assets: array<int, array{from: string, to: string, copied: bool}>}
     */
    public function importAll(): array
    {
        $report = [
            'tables' => [],
            'assets' => [],
        ];

        $mainTables = [
            'categories',
            'products',
            'site_announcement_config',
            'site_announcements',
            'site_contact_config',
            'site_global_config',
            'site_services_config',
            'site_services',
            'media_library',
            'pages',
            'posts',
            'sales',
            'sale_items',
            'orders',
            'order_items',
            'users',
        ];

        $repairTables = [
            'ordenes',
            'orden_eventos',
        ];

        DB::connection(self::TARGET_CONNECTION)->statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($mainTables as $table) {
                $report['tables'][] = [
                    'name' => $table,
                    'imported' => $this->copyTable(self::SOURCE_CONNECTION, self::TARGET_CONNECTION, $table),
                ];
            }

            foreach ($repairTables as $table) {
                $report['tables'][] = [
                    'name' => $table,
                    'imported' => $this->copyTable(self::SOURCE_REPAIRS_CONNECTION, self::TARGET_CONNECTION, $table, true),
                ];
            }
        } finally {
            DB::connection(self::TARGET_CONNECTION)->statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $assetMappings = [
            ['from' => 'C:\\tienda-abril\\assets\\img', 'to' => public_path('assets/img')],
            ['from' => 'C:\\tienda-abril\\assets\\uploads\\products', 'to' => public_path('assets/uploads/products')],
            ['from' => 'C:\\tienda-abril\\assets\\uploads\\library', 'to' => public_path('assets/uploads/library')],
            ['from' => 'C:\\tienda-abril\\uploads', 'to' => public_path('uploads')],
        ];

        foreach ($assetMappings as $mapping) {
            $copied = $this->mirrorDirectory($mapping['from'], $mapping['to']);
            $report['assets'][] = [
                'from' => $mapping['from'],
                'to' => $mapping['to'],
                'copied' => $copied,
            ];
        }

        $this->ensureLocalAdmin();

        return $report;
    }

    private function copyTable(string $sourceConnection, string $targetConnection, string $table, bool $allowMissing = false): int|string
    {
        if (!Schema::connection($targetConnection)->hasTable($table)) {
            return $allowMissing ? 'skipped-target-missing' : throw new RuntimeException("Missing target table: {$table}");
        }

        if (!Schema::connection($sourceConnection)->hasTable($table)) {
            return $allowMissing ? 'skipped-source-missing' : throw new RuntimeException("Missing source table: {$table}");
        }

        $targetColumns = Schema::connection($targetConnection)->getColumnListing($table);
        $sourceColumns = Schema::connection($sourceConnection)->getColumnListing($table);
        $columns = array_values(array_intersect($targetColumns, $sourceColumns));

        if ($table === 'users') {
            $columns = array_values(array_intersect(['id', 'name', 'email', 'role', 'created_at'], $sourceColumns));
        }

        if ($columns === []) {
            return $allowMissing ? 'skipped-no-common-columns' : throw new RuntimeException("No common columns for: {$table}");
        }

        DB::connection($targetConnection)->table($table)->delete();

        $rows = DB::connection($sourceConnection)->table($table)->get($columns);
        if ($rows->isEmpty()) {
            return 0;
        }

        $payload = $rows
            ->map(function (object $row) use ($columns, $table): array {
                $normalized = Arr::only((array) $row, $columns);

                if ($table === 'users') {
                    $normalized['password'] = Hash::make('admin12345');
                    $normalized['updated_at'] = $normalized['created_at'] ?? now()->toDateTimeString();
                }

                return $normalized;
            })
            ->values()
            ->all();

        foreach (array_chunk($payload, self::CHUNK_SIZE) as $chunk) {
            DB::connection($targetConnection)->table($table)->insert($chunk);
        }

        return count($payload);
    }

    private function mirrorDirectory(string $from, string $to): bool
    {
        if (!File::isDirectory($from)) {
            return false;
        }

        File::ensureDirectoryExists($to);
        File::copyDirectory($from, $to);

        return true;
    }

    private function ensureLocalAdmin(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@tienda.local'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin12345'),
                'role' => 'admin',
            ],
        );
    }
}
