<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use ZipArchive;

class BackupService
{
    private const MAX_UPLOAD_BYTES = 314572800;

    public function list(): array
    {
        $directory = public_path(config('tienda.uploads.backups'));

        if (! File::isDirectory($directory)) {
            return [];
        }

        return collect(File::files($directory))
            ->filter(fn ($file): bool => $file->getExtension() === 'zip')
            ->sortByDesc(fn ($file) => $file->getMTime())
            ->values()
            ->map(fn ($file): array => [
                'file_name' => $file->getFilename(),
                'size' => $file->getSize(),
                'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
            ])
            ->all();
    }

    public function create(): string
    {
        $directory = public_path(config('tienda.uploads.backups'));
        File::ensureDirectoryExists($directory);

        $fileName = 'backup_tienda_' . now()->format('Ymd_His') . '.zip';
        $archivePath = $directory . DIRECTORY_SEPARATOR . $fileName;
        $tmpDir = storage_path('app/tmp/backup_' . uniqid('', true));

        File::ensureDirectoryExists($tmpDir);

        $payload = [
            'created_at' => now()->toDateTimeString(),
            'tables' => $this->dumpTables(),
        ];

        File::put($tmpDir . DIRECTORY_SEPARATOR . 'backup.json', json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        foreach (config('tienda.uploads') as $key => $relativePath) {
            if ($key === 'backups') {
                continue;
            }

            $source = public_path($relativePath);
            if (File::isDirectory($source)) {
                File::copyDirectory($source, $tmpDir . DIRECTORY_SEPARATOR . $relativePath);
            }
        }

        $zip = new ZipArchive();
        $zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach (File::allFiles($tmpDir) as $file) {
            $zip->addFile($file->getRealPath(), str_replace($tmpDir . DIRECTORY_SEPARATOR, '', $file->getRealPath()));
        }

        $zip->close();
        File::deleteDirectory($tmpDir);

        return $fileName;
    }

    public function storeUploadedBackup(UploadedFile $file): string
    {
        if (strtolower((string) $file->getClientOriginalExtension()) !== 'zip') {
            throw new RuntimeException('Solo se permiten archivos ZIP de backup.');
        }

        if ((int) $file->getSize() <= 0) {
            throw new RuntimeException('El archivo ZIP subido esta vacio.');
        }

        if ((int) $file->getSize() > self::MAX_UPLOAD_BYTES) {
            throw new RuntimeException('El archivo ZIP supera el limite permitido de 300 MB.');
        }

        $directory = public_path(config('tienda.uploads.backups'));
        File::ensureDirectoryExists($directory);

        $fileName = $this->uniqueBackupFileName($this->normalizeBackupFileName($file->getClientOriginalName()));
        $archivePath = $directory . DIRECTORY_SEPARATOR . $fileName;

        $file->move($directory, $fileName);

        try {
            $tmpDir = $this->extractArchive($archivePath);
            File::deleteDirectory($tmpDir);
        } catch (\Throwable $exception) {
            if (File::exists($archivePath)) {
                File::delete($archivePath);
            }

            throw $exception;
        }

        return $fileName;
    }

    public function delete(string $fileName): void
    {
        $path = public_path(config('tienda.uploads.backups') . DIRECTORY_SEPARATOR . basename($fileName));
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    public function restore(string $fileName): void
    {
        $archivePath = public_path(config('tienda.uploads.backups') . DIRECTORY_SEPARATOR . basename($fileName));
        if (! File::exists($archivePath)) {
            throw new RuntimeException('Backup no encontrado.');
        }

        $tmpDir = $this->extractArchive($archivePath);
        $backupFile = $tmpDir . DIRECTORY_SEPARATOR . 'backup.json';
        $payload = json_decode((string) File::get($backupFile), true);

        $tables = array_keys($payload['tables']);

        try {
            DB::transaction(function () use ($payload, $tables): void {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');

                try {
                    foreach (array_reverse($tables) as $table) {
                        if (DB::getSchemaBuilder()->hasTable($table)) {
                            DB::table($table)->delete();
                        }
                    }

                    foreach ($payload['tables'] as $table => $rows) {
                        if (! DB::getSchemaBuilder()->hasTable($table) || ! is_array($rows) || $rows === []) {
                            continue;
                        }

                        foreach (array_chunk($rows, 250) as $chunk) {
                            DB::table($table)->insert(array_map(
                                fn ($row): array => is_array($row) ? $row : Arr::wrap($row),
                                $chunk,
                            ));
                        }
                    }
                } finally {
                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                }
            });

            foreach (config('tienda.uploads') as $key => $relativePath) {
                if ($key === 'backups') {
                    continue;
                }

                $source = $tmpDir . DIRECTORY_SEPARATOR . $relativePath;
                $destination = public_path($relativePath);

                if (File::isDirectory($destination)) {
                    File::deleteDirectory($destination);
                }

                if (File::isDirectory($source)) {
                    File::copyDirectory($source, $destination);
                }
            }
        } finally {
            File::deleteDirectory($tmpDir);
        }
    }

    private function dumpTables(): array
    {
        $tables = [
            'categories',
            'products',
            'users',
            'site_announcements',
            'site_announcement_config',
            'site_contact_config',
            'site_services',
            'site_services_config',
            'site_global_config',
            'media_library',
            'auth_login_rate_limits',
            'sales',
            'sale_items',
            'orders',
            'order_items',
            'pages',
            'posts',
            'ordenes',
            'orden_eventos',
        ];

        $dump = [];

        foreach ($tables as $table) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                continue;
            }

            $dump[$table] = DB::table($table)->get()->map(fn ($row): array => (array) $row)->all();
        }

        return $dump;
    }

    private function extractArchive(string $archivePath): string
    {
        $tmpDir = storage_path('app/tmp/restore_' . uniqid('', true));
        File::ensureDirectoryExists($tmpDir);

        $zip = new ZipArchive();
        if ($zip->open($archivePath) !== true) {
            File::deleteDirectory($tmpDir);
            throw new RuntimeException('No se pudo abrir el archivo ZIP.');
        }

        if ($zip->extractTo($tmpDir) !== true) {
            $zip->close();
            File::deleteDirectory($tmpDir);
            throw new RuntimeException('No se pudo extraer el archivo ZIP.');
        }

        $zip->close();

        $backupFile = $tmpDir . DIRECTORY_SEPARATOR . 'backup.json';
        if (! File::exists($backupFile)) {
            File::deleteDirectory($tmpDir);
            throw new RuntimeException('El backup no contiene backup.json.');
        }

        $payload = json_decode((string) File::get($backupFile), true);
        if (! is_array($payload) || ! isset($payload['tables']) || ! is_array($payload['tables'])) {
            File::deleteDirectory($tmpDir);
            throw new RuntimeException('El backup tiene un formato invalido.');
        }

        if (array_intersect(array_keys($payload['tables']), $this->backupTableOrder()) === []) {
            File::deleteDirectory($tmpDir);
            throw new RuntimeException('El backup no contiene tablas compatibles para restaurar.');
        }

        return $tmpDir;
    }

    private function normalizeBackupFileName(string $originalName): string
    {
        $baseName = pathinfo(trim($originalName), PATHINFO_FILENAME);
        $baseName = preg_replace('/[^A-Za-z0-9._-]+/', '-', (string) $baseName) ?: 'backup_tienda_importado_' . now()->format('Ymd_His');
        $baseName = trim((string) $baseName, '-_.');

        if ($baseName === '') {
            $baseName = 'backup_tienda_importado_' . now()->format('Ymd_His');
        }

        return $baseName . '.zip';
    }

    private function uniqueBackupFileName(string $fileName): string
    {
        $directory = public_path(config('tienda.uploads.backups'));
        File::ensureDirectoryExists($directory);

        $baseName = pathinfo($fileName, PATHINFO_FILENAME);
        $extension = '.' . ltrim((string) pathinfo($fileName, PATHINFO_EXTENSION), '.');
        $candidate = $baseName . $extension;
        $counter = 1;

        while (File::exists($directory . DIRECTORY_SEPARATOR . $candidate)) {
            $candidate = $baseName . '_importado_' . $counter . $extension;
            $counter++;
        }

        return $candidate;
    }

    private function backupTableOrder(): array
    {
        return [
            'categories',
            'products',
            'users',
            'site_announcements',
            'site_announcement_config',
            'site_contact_config',
            'site_services',
            'site_services_config',
            'site_global_config',
            'media_library',
            'auth_login_rate_limits',
            'sales',
            'sale_items',
            'orders',
            'order_items',
            'pages',
            'posts',
            'ordenes',
            'orden_eventos',
        ];
    }
}
